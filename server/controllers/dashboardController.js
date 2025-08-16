const User = require('../model/user');
const Department = require('../model/department.model');

/**
 * @desc    Get data for the admin data health dashboard
 * @route   GET /api/dashboard/data-health
 * @access  Private/Admin
 */
exports.getDataHealth = async (req, res, next) => {
    try {
        // Find all active users who are NOT super-admins and have no manager assigned.
        // The super-admin is the only valid user to have a null manager.
        const usersWithoutManager = await User.find({
            role: { $ne: 'super-admin' },
            manager: null,
            isActive: true
        }).select('name email role');

        // Find all departments that do not have a manager assigned.
        const deptsWithoutHOD = await Department.find({
            manager: null
        }).select('name');
        
        res.status(200).json({
            success: true,
            data: {
                usersWithoutManager,
                deptsWithoutHOD,
            }
        });
    } catch (error) {
        next(error);
    }
};