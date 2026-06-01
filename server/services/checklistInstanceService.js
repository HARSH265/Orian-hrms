const ChecklistInstance = require('../model/checklistInstance.model');
const User = require('../model/user');
const logger = require('../utils/logger');

const getActiveChecklistInstances = async (user) => {
    let query = { status: 'In Progress' };

    if (user.role === 'manager') {
        const teamMembers = await User.find({ manager: user.id }).select('_id');
        const teamMemberIds = teamMembers.map(member => member._id);
        query.targetUser = { $in: teamMemberIds };
    }

    const instances = await ChecklistInstance.find(query)
        .limit(10)
        .populate('template', 'name')
        .populate('targetUser', 'name profilePictureUrl')
        .populate('generatedTasks', 'status')
        .sort({ createdAt: -1 });

    return instances;
};

module.exports = {
    getActiveChecklistInstances,
};
