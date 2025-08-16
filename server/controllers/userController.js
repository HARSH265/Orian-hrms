// controllers/userController.js
const User = require('../model/user');

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, jobTitle, department } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // We don't generate tokens here. The user will log in themselves later.
        const user = await User.create({ name, email, password, role, jobTitle, department });
        
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Update current user's self-service profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
    try {
        // Only allow updating non-sensitive, self-service fields
        const { name, address, phone, emergencyContact, profilePictureUrl } = req.body;
        
        const updates = { name, address, phone, emergencyContact, profilePictureUrl };
        
        const user = await User.findByIdAndUpdate(req.user.id, updates, {
            new: true, // Return the updated document
            runValidators: true,
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('department', 'name') // This one is for the department name
            .populate('manager', 'name');   // <-- ADD THIS LINE to get the manager's name

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (for admins)
// @route   GET /api/users
// @access  Private/Admin
// Make sure your getAllUsers function looks like this
exports.getAllUsers = async (req, res, next) => {
    try {
        // --- THIS IS THE FIX ---
        // We get ALL users EXCEPT the one making the request.
        const users = await User.find({ _id: { $ne: req.user.id } })
            .populate('department', 'name')
            .populate('manager', 'name');
        // --- END OF FIX ---
            
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update a user's details (by Admin)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUserById = async (req, res, next) => {
    try {
        // We get the user ID from the URL parameters
        const userId = req.params.id;
        
        // We get the data to update from the request body
        // This can include role, department, jobTitle, manager, isActive, etc.
        const updates = req.body;

        // Find the user by their ID and update them with the new data
        // { new: true } ensures the updated document is returned
        // { runValidators: true } ensures any model validations are run
        const updatedUser = await User.findByIdAndUpdate(userId, updates, {
            new: true,
            runValidators: true,
        });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: `User not found with id of ${userId}` });
        }

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Deactivate a user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deactivateUser = async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Instead of deleting, we find the user and set their 'isActive' flag to false
        const deactivatedUser = await User.findByIdAndUpdate(userId, { isActive: false }, {
            new: true,
        });
        
        if (!deactivatedUser) {
            return res.status(404).json({ success: false, message: `User not found with id of ${userId}` });
        }

        // We send a success message but no data (204 No Content could also be used)
        res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        next(error);
    }
};


/**
 * @desc    Get all users with a manager-level role
 * @route   GET /api/users/managers
 * @access  Private/Admin
 */
exports.getManagerUsers = async (req, res, next) => {
    try {
        // Find all users whose role is one of the manager-level roles
        const managers = await User.find({ role: { $in: ['manager', 'hr', 'super-admin'] } }).select('name');
        res.status(200).json({ success: true, data: managers });
    } catch (error) {
        next(error);
    }
};
/**
 * @desc    Mark the welcome wizard as complete for the logged-in user
 * @route   PUT /api/users/complete-wizard
 * @access  Private
 */
exports.completeWelcomeWizard = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user.id, { needsWelcomeWizard: false });
        res.status(200).json({ success: true, message: 'Welcome wizard completed.' });
    } catch (error) {
        next(error);
    }
};