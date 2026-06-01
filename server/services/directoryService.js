const User = require('../model/user');
const logger = require('../utils/logger');

const getChatDirectory = async (currentUser) => {
    let query = {};

    switch (currentUser.role) {
        case 'super-admin':
        case 'hr':
            break;

        case 'manager':
            query = {
                $or: [
                    { department: currentUser.department },
                    { role: 'manager' },
                ]
            };
            break;

        case 'employee':
        default:
            if (!currentUser.department) {
                return [];
            }
            query = { department: currentUser.department };
            break;
    }

    query._id = { $ne: currentUser._id };
    query.isActive = true;

    let permittedUsers = await User.find(query)
        .select('name profilePictureUrl jobTitle role department');

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

    return permittedUsers;
};

module.exports = {
    getChatDirectory,
};
