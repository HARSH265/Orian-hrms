const TaskTemplate = require('../model/taskTemplate.model');
const Task = require('../model/task.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');

const getTemplates = async (queryParams) => {
    const { category, isActive } = queryParams;
    const filter = {};
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    return TaskTemplate.find(filter).populate('createdBy', 'name').sort({ category: 1, title: 1 });
};

const getTemplateById = async (id) => {
    const template = await TaskTemplate.findById(id).populate('createdBy', 'name');
    if (!template) {
        const err = new Error('Task template not found');
        err.status = 404;
        throw err;
    }
    return template;
};

const createTemplate = async (data, userId, ip) => {
    const template = await TaskTemplate.create({ ...data, createdBy: userId });
    await createAuditLog({
        actor: userId, action: 'TASK_TEMPLATE_CREATED',
        target: { id: template._id, type: 'TaskTemplate' },
        details: { title: template.title },
        ipAddress: ip,
    });
    return template.populate('createdBy', 'name');
};

const updateTemplate = async (id, data, userId, ip) => {
    const template = await TaskTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!template) {
        const err = new Error('Task template not found');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'TASK_TEMPLATE_UPDATED',
        target: { id: template._id, type: 'TaskTemplate' },
        details: { title: template.title },
        ipAddress: ip,
    });
    return template.populate('createdBy', 'name');
};

const deleteTemplate = async (id, userId) => {
    const template = await TaskTemplate.findByIdAndDelete(id);
    if (!template) {
        const err = new Error('Task template not found');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'TASK_TEMPLATE_DELETED',
        target: { id: template._id, type: 'TaskTemplate' },
        details: { title: template.title },
    });
    return { message: 'Template deleted' };
};

const applyTemplate = async (templateId, targetUserId, creatorId, ip) => {
    const template = await TaskTemplate.findById(templateId);
    if (!template) {
        const err = new Error('Task template not found');
        err.status = 404;
        throw err;
    }

    let assigneeId;
    switch (template.defaultAssignee.assigneeType) {
        case 'TargetUser':
            assigneeId = targetUserId;
            break;
        case 'TargetUsersManager': {
            const targetUser = await User.findById(targetUserId).select('manager');
            assigneeId = targetUser?.manager || creatorId;
            break;
        }
        case 'Creator':
            assigneeId = creatorId;
            break;
        case 'Role': {
            const usersWithRole = await User.find({ roles: template.defaultAssignee.roleId }).limit(1).select('_id');
            assigneeId = usersWithRole[0]?._id || creatorId;
            break;
        }
        default:
            assigneeId = creatorId;
    }

    const dueDate = template.dueDays > 0
        ? new Date(Date.now() + template.dueDays * 24 * 60 * 60 * 1000)
        : undefined;

    const task = await Task.create({
        title: template.title,
        description: template.description,
        priority: template.priority,
        assignees: [assigneeId],
        creator: creatorId,
        dueDate,
        checklistTemplate: template.checklistTemplate || undefined,
    });

    await createAuditLog({
        actor: creatorId, action: 'TASK_CREATED_FROM_TEMPLATE',
        target: { id: task._id, type: 'Task' },
        details: { template: template.title },
        ipAddress: ip,
    });

    await task.populate('assignees', 'name profilePictureUrl');
    return task;
};

module.exports = {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
};
