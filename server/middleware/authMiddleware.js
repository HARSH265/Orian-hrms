const jwt = require('jsonwebtoken');
const User = require('../model/user');
const mongoose = require('mongoose');
const { SYSTEM_ROLE_PERMISSIONS } = require('../config/permissions');
const { isBlacklisted } = require('../utils/tokenBlacklist');
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

        if (isBlacklisted(decoded.jti)) {
            return res.status(401).json({ success: false, message: 'Not authorized, token has been revoked' });
        }
        
        if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({ success: false, message: 'Not authorized, token payload invalid' });
        }

        req.user = await User.findById(decoded.id)
            .select('systemRole roles')
            .populate({
                path: 'roles',
                select: 'name permissions'
            });

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
        }

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

exports.checkPermissions = (...requiredPermissions) => {
    return (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }

            if (user.systemRole === 'super-admin') {
                return next();
            }
            
            let allUserPermissions = user.permissions;
            if (!allUserPermissions) {
                const systemPerms = SYSTEM_ROLE_PERMISSIONS[user.systemRole] || [];
                const rolePerms = user.roles.reduce((acc, role) => {
                    return [...acc, ...(role.permissions || [])];
                }, []);
                allUserPermissions = new Set([...systemPerms, ...rolePerms]);
            }

            const hasAllPermissions = requiredPermissions.every(p => allUserPermissions.has(p));

            if (hasAllPermissions) {
                next();
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
