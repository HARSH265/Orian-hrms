const User = require('../model/user'); // Adjust path if needed
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get the list of users the logged-in user is permitted to chat with
// @route   GET /api/directory/chat-directory
// @access  Private
exports.getChatDirectory = asyncHandler(async (req, res, next) => {
    try {
        const currentUser = req.user;
        let query = {};

        // Apply the business rules using Mongoose queries
        switch (currentUser.role) {
            case 'super-admin':
            case 'hr':
                // Rule 1: Super Admin and HR can see everyone.
                // The query remains empty to find all users.
                break;

            case 'manager':
                // Rule 2: Managers can see their department, other managers, and their own manager.
                query = {
                    $or: [
                        { department: currentUser.department }, // Anyone in their department
                        { role: 'manager' }, // Any other manager
                    ]
                });
                // We'll add their own manager to the list separately if they have one.
                break;

            case 'employee':
            default:
                // Rule 3: Employees can only see people in their own department.
                if (!currentUser.department) {
                    // If an employee has no department, they can chat with no one.
                    return res.status(200).json({ success: true, data: [] });
                }
                query = { department: currentUser.department };
                break;
        }

        // Always exclude the current user from the list.
        query._id = { $ne: currentUser._id };
        // Only show active users.
        query.isActive = true;

        let permittedUsers = await User.find(query)
            .select('name profilePictureUrl jobTitle role department'); // Only return safe fields

        // Special case for Manager: Ensure their own manager is included if not already in the list
        if (currentUser.role === 'manager' && currentUser.manager) {
            const managerId = currentUser.manager.toString();
            const managerAlreadyInList = permittedUsers.some(u => u._id.toString() === managerId);
            if (!managerAlreadyInList) {
                const ownManager = await User.findById(managerId).select('name profilePictureUrl jobTitle role department');
                if (ownManager) {
                    permittedUsers.push(ownManager);
                }
            }
        }
        
        res.status(200).json({ success: true, count: permittedUsers.length, data: permittedUsers });

    } catch (error) {
        next(error);
    }
};