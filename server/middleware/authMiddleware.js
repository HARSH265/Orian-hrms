// In: server/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../model/user');
const mongoose = require('mongoose');
const { SUPER_ADMIN_PERMISSIONS, SYSTEM_ROLE_PERMISSIONS } = require('../config/permissions');
const NodeCache = require('node-cache');
const permissionCache = new NodeCache({ stdTTL: 300 });

exports.protect = async (req, res, next) => {
    let token;
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({ success: false, message: 'Not authorized, token payload invalid' });
        }

        // Now, we must populate the permissions from the user's assigned roles
        req.user = await User.findById(decoded.id)
            .select('systemRole roles')
            .populate({
                path: 'roles',
                select: 'name permissions' // Select the permissions from each role
            });

if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
}

// Cache combined permissions for the user (system role + functional roles)
const cacheKey = req.user._id.toString();
let cachedPerms = permissionCache.get(cacheKey);
if (!cachedPerms) {
    const systemPerms = SYSTEM_ROLE_PERMISSIONS[req.user.systemRole] || [];
    const rolePerms = req.user.roles.reduce((acc, role) => {
        return [...acc, ...(role.permissions || [])];
    }, []);
    cachedPerms = new Set([...systemPerms, ...rolePerms]);
    permissionCache.set(cacheKey, cachedPerms);
}
req.user.permissions = cachedPerms;

next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

// The old `authorize` is now deprecated. We keep it for reference but will replace it.
exports.authorize = (...systemRoles) => {
    return (req, res, next) => {
        if (!req.user || !systemRoles.includes(req.user.systemRole)) {
            return res.status(403).json({ success: false, message: `Access denied.` });
        }
        next();
    };
};

// --- THE NEW, GRANULAR PERMISSION CHECKING MIDDLEWARE ---
exports.checkPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }

            // --- A Super Admin can do anything, always ---
            if (user.systemRole === 'super-admin') {
                return next();
            }
            
 // Use cached permissions if available
 let allUserPermissions = user.permissions;
 if (!allUserPermissions) {
     const systemPerms = SYSTEM_ROLE_PERMISSIONS[user.systemRole] || [];
     const rolePerms = user.roles.reduce((acc, role) => {
         return [...acc, ...(role.permissions || [])];
     }, []);
     allUserPermissions = new Set([...systemPerms, ...rolePerms]);
 }

            // 3. Check if the user has ALL of the required permissions for this route
            const hasAllPermissions = requiredPermissions.every(p => allUserPermissions.has(p));

            if (hasAllPermissions) {
                next(); // User has permission, proceed
            } else {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Forbidden: You do not have the required permissions for this action.' 
                });
            }
        } catch (error) {
            next(error);
        }
    };
};











// // In: server/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
// const User = require('../model/user');
// const mongoose = require('mongoose');
// const { SYSTEM_ROLE_PERMISSIONS } = require('../config/permissions');

// exports.protect = async (req, res, next) => {
//     let token;
//     try {
//         if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//             token = req.headers.authorization.split(' ')[1];
//         }
//         if (!token) {
//             return res.status(401).json({ success: false, message: 'Not authorized, no token' });
//         }

//         const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        
//         if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
//             return res.status(401).json({ success: false, message: 'Not authorized, token payload invalid' });
//         }

//         // =======================================================================
//         // --- THE FINAL FIX: Remove the `-password` from the .select() ---
//         // The `password` field is already excluded by default in your User model
//         // because of `select: false`. We only need to specify the fields to INCLUDE.
//         req.user = await User.findById(decoded.id).select('systemRole roles').populate('roles', 'name');
//         // =======================================================================

//         if (!req.user) {
//             return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
//         }
        
//         next();
//     } catch (error) {
//         console.error('Error in protect middleware:', error); // Log the actual error for better debugging
//         return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
//     }
// };

// exports.authorize = (...systemRoles) => {
//     return (req, res, next) => {
//         if (!req.user || !systemRoles.includes(req.user.systemRole)) {
//             return res.status(403).json({ 
//                 success: false, 
//                 message: `User role '${req.user?.systemRole || 'unknown'}' is not authorized to access this route.`
//             });
//         }
//         next();
//     };
// };

// exports.checkPermissions = (...requiredPermissions) => {
//     return (req, res, next) => {
//         try {
//             const user = req.user;
//             if (!user) {
//                 return res.status(401).json({ success: false, message: 'Not authorized' });
//             }

//             // 1. Get permissions granted by the user's system role
//             const systemPermissions = SYSTEM_ROLE_PERMISSIONS[user.systemRole] || [];

//             // 2. Get permissions granted by the user's functional roles (e.g., "IT Support")
//             const functionalRolePermissions = user.roles.reduce((acc, role) => {
//                 return [...acc, ...role.permissions];
//             }, []);
            
//             // 3. Combine all permissions into a single set to remove duplicates
//             const allUserPermissions = new Set([...systemPermissions, ...functionalRolePermissions]);

//             // 4. Check if the user has ALL of the required permissions for this route
//             const hasAllPermissions = requiredPermissions.every(p => allUserPermissions.has(p));

//             if (hasAllPermissions) {
//                 next(); // User has permission, proceed
//             } else {
//                 return res.status(403).json({ 
//                     success: false, 
//                     message: 'Forbidden: You do not have the required permissions for this action.' 
//                 });
//             }
//         } catch (error) {
//             next(error);
//         }
//     };
// };