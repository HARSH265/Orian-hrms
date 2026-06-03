const ChecklistInstance = require('../model/checklistInstance.model');
const User = require('../model/user');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { getDescendantIds } = require('../utils/teamTree');

const getActiveChecklistInstances = async (user, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });

    let query = { status: 'In Progress' };

    if (user.systemRole === 'manager') {
        const teamMemberIds = await getDescendantIds(user.id);
        query.targetUser = { $in: teamMemberIds };
    }

    const [instances, total] = await Promise.all([
        ChecklistInstance.find(query)
            .populate('template', 'name')
            .populate('targetUser', 'name profilePictureUrl')
            .populate('generatedTasks', 'status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        ChecklistInstance.countDocuments(query),
    ]);

    return { data: instances, pagination: buildPagination(total, p, l) };
};

const getInstanceById = async (instanceId, userId) => {
    const instance = await ChecklistInstance.findById(instanceId)
        .populate('template', 'name description')
        .populate('targetUser', 'name profilePictureUrl email')
        .populate('createdBy', 'name')
        .populate({ path: 'generatedTasks', populate: { path: 'assignees', select: 'name profilePictureUrl' } });
    if (!instance) throw { statusCode: 404, message: 'Checklist instance not found' };
    return instance;
};

module.exports = { getActiveChecklistInstances, getInstanceById };
