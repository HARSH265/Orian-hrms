const mongoose = require('mongoose');
const Task = require('../model/task.model');
const User = require('../model/user');
const Document = require('../model/Document'); // for attachments
const { createAuditLog } = require('./auditLogService');
const { createNotification } = require('./notificationService');

/**
 * Helper to build task query (same as controller).
 */
const buildTaskQuery = (baseQuery, queryParams) => {
    let query = { ...baseQuery };
    const { status, priority, assignee, search } = queryParams;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) query.assignees = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };
    return query;
};

/**
 * Create a new task.
 * Expects the Express request object to extract body, user, ip.
 */
const createTask = async (req) => {
    const { title, description, priority, assignees, dueDate, attachments, timeEstimate, customFieldValues } = req.body;
    const creator = req.user;

    // Validate assignees
    if (!assignees || !Array.isArray(assignees) || assignees.length === 0) {
        const err = new Error('Assignees must be a non-empty array.');
        err.status = 400;
        throw err;
    }
    const assigneeDocs = await User.find({ _id: { $in: assignees } });
    if (assigneeDocs.length !== assignees.length) {
        const err = new Error('One or more assignees not found.');
        err.status = 404;
        throw err;
    }

    // Authorization check – replicated from controller logic.
    for (const assigneeDoc of assigneeDocs) {
        let isAuthorized = false;
        const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
        const creatorRoleIndex = roleHierarchy.indexOf(creator.role);
        const assigneeRoleIndex = roleHierarchy.indexOf(assigneeDoc.role);
        if (creator.role === 'employee' && creator.manager?.toString() === assigneeDoc._id.toString()) { isAuthorized = true; }
        if (creator.role === 'manager') {
            const isDirectReport = assigneeDoc.manager?.toString() === creator._id.toString();
            const isAssigneeHr = assigneeDoc.role === 'hr';
            if (isDirectReport || isAssigneeHr) { isAuthorized = true; }
        }
        if (creator.role === 'hr' || creator.role === 'super-admin') {
            if (assigneeRoleIndex <= creatorRoleIndex && creator._id.toString() !== assigneeDoc._id.toString()) { isAuthorized = true; }
        }
        if (!isAuthorized) {
            const err = new Error(`You are not authorized to assign a task to ${assigneeDoc.name}.`);
            err.status = 403;
            throw err;
        }
    }

    const taskData = {
        title,
        description,
        priority,
        assignees,
        dueDate,
        creator: creator.id,
        timeEstimate: timeEstimate || 0,
        attachments: [],
        customFieldValues: customFieldValues || []
    };

    // Handle optional attachments
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        const documentPromises = attachments.map(att => Document.create({
            title: att.originalName,
            fileUrl: att.url,
            category: 'Task Attachment',
            uploadedBy: creator.id
        }));
        const createdDocuments = await Promise.all(documentPromises);
        taskData.attachments = createdDocuments.map(doc => doc._id);
    }

    const task = await Task.create(taskData);

    // Audit log
    await createAuditLog({
        actor: req.user.id,
        action: 'TASK_CREATED',
        target: { id: task._id, type: 'Task' },
        details: {
            title: task.title,
            assignedTo: assigneeDocs.map(d => d.name).join(', '),
            attachmentsCount: task.attachments.length,
            timeEstimate: task.timeEstimate
        },
        ipAddress: req.ip
    });

    // Notification
    await createNotification({
        taskId: task._id,
        sender: creator.id,
        message: `${creator.name} assigned you a new task: "${title}"`,
        link: '/tasks',
        type: 'Task',
    }, req);

    // Populate before returning
    await task.populate('assignees', 'name profilePictureUrl');
    await task.populate('attachments', 'title fileUrl');
    return task;
};

/**
 * Create a sub‑task under a parent task.
 */
const createSubTask = async (req) => {
    const parentTask = await Task.findById(req.params.id);
    if (!parentTask) {
        const err = new Error('Parent task not found.');
        err.status = 404;
        throw err;
    }
    // Check nesting depth (max 3 levels)
    if (parentTask._id) {
        let depth = 0;
        let currentParent = parentTask.parentTask;
        while (currentParent && depth < 10) {
            const parent = await Task.findById(currentParent).select('parentTask').lean();
            if (!parent || !parent.parentTask) break;
            currentParent = parent.parentTask;
            depth++;
        }
        if (depth >= 3) {
            const err = new Error('Maximum subtask nesting depth (3 levels) reached.');
            err.status = 400;
            throw err;
        }
    }
    // Security check – same as controller
    const isCreator = parentTask.creator.toString() === req.user.id.toString();
    const isAssignee = parentTask.assignees.some(id => id.toString() === req.user.id.toString());
    if (!isCreator && !isAssignee && req.user.role !== 'super-admin') {
        const err = new Error('You are not authorized to add sub‑tasks to this parent task.');
        err.status = 403;
        throw err;
    }
    const { title, assignees } = req.body;
    const subTask = await Task.create({
        title,
        assignees,
        creator: req.user.id,
        parentTask: parentTask._id,
        priority: parentTask.priority,
        dueDate: parentTask.dueDate
    });
    parentTask.subTasks.push(subTask._id);
    await parentTask.save();
    await createAuditLog({
        actor: req.user.id,
        action: 'SUBTASK_CREATED',
        target: { id: subTask._id, type: 'Task' },
        details: { title: subTask.title, parent: parentTask.title },
        ipAddress: req.ip
    });
    await subTask.populate('assignees', 'name profilePictureUrl');
    return subTask;
};

/**
 * Retrieve a single task by ID with full details and security checks.
 */
const getTaskById = async (req) => {
    const task = await Task.findById(req.params.id)
        .populate('creator', 'name')
        .populate('assignees', 'name profilePictureUrl manager')
        .populate('attachments', 'title fileUrl')
        .populate({ path: 'comments', populate: { path: 'author', select: 'name profilePictureUrl' } })
        .populate({ path: 'customFieldValues', populate: { path: 'field', model: 'CustomField' } })
        .populate({
            path: 'subTasks',
            select: 'title status assignees',
            populate: { path: 'assignees', select: 'name profilePictureUrl' }
        })
        .lean();
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator._id.toString() === req.user.id.toString();
    const isAssignee = task.assignees.some(a => a._id.toString() === req.user.id.toString());
    const isManagerOfAssignee = task.assignees.some(a => a.manager?.toString() === req.user.id.toString());
    if (!isCreator && !isAssignee && !isManagerOfAssignee && req.user.role !== 'super-admin' && req.user.role !== 'hr') {
        const err = new Error('Not authorized to view this task');
        err.status = 403;
        throw err;
    }
    return task;
};

/**
 * Get tasks assigned to the logged‑in user.
 */
const getMyTasks = async (req) => {
    const baseQuery = { assignees: req.user.id };
    const finalQuery = buildTaskQuery(baseQuery, req.query);
    const sortBy = req.query.sortBy || 'dueDate';
    const order = req.query.order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const [tasks, totalTasks] = await Promise.all([
        Task.find(finalQuery)
            .populate('creator', 'name')
            .populate('assignees', 'name profilePictureUrl')
            .populate('attachments', 'title fileUrl')
            .populate('dependsOn', 'title')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(finalQuery)
    ]);
    return { tasks, totalTasks, page, limit };
};

/**
 * Get tasks for the manager's team.
 */
const getTeamTasks = async (req) => {
    // Debug logs removed for service layer
    const teamMembers = await User.find({ manager: req.user.id }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);
    const baseQuery = { assignees: { $in: teamMemberIds } };
    const finalQuery = buildTaskQuery(baseQuery, req.query);
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const [tasks, totalTasks] = await Promise.all([
        Task.find(finalQuery)
            .populate('assignees', 'name profilePictureUrl')
            .populate('creator', 'name')
            .populate('attachments', 'title fileUrl')
            .populate('dependsOn', 'title')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(finalQuery)
    ]);
    return { tasks, totalTasks, page, limit };
};

/**
 * Get all tasks (admin view).
 */
const getAllTasks = async (req) => {
    const baseQuery = {};
    const finalQuery = buildTaskQuery(baseQuery, req.query);
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const skip = (page - 1) * limit;
    const [tasks, totalTasks] = await Promise.all([
        Task.find(finalQuery)
            .populate('assignees', 'name profilePictureUrl')
            .populate('creator', 'name')
            .populate('attachments', 'title fileUrl')
            .populate('dependsOn', 'title')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(finalQuery)
    ]);
    return { tasks, totalTasks, page, limit };
};

/**
 * Update a task's core details (admin/creator).
 */
const updateTask = async (req) => {
    let task = await Task.findById(req.params.id);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === req.user.id.toString();
    if (!isCreator && req.user.role !== 'super-admin' && req.user.role !== 'hr') {
        const err = new Error('Not authorized to edit this task details.');
        err.status = 403;
        throw err;
    }
    // Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['title', 'description', 'priority', 'dueDate', 'timeEstimate', 'assignees', 'customFieldValues'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
            filteredUpdates[field] = req.body[field];
        }
    });
    task = await Task.findByIdAndUpdate(req.params.id, filteredUpdates, { new: true, runValidators: true });
    await createAuditLog({
        actor: req.user.id,
        action: 'TASK_UPDATED',
        target: { id: task._id, type: 'Task' },
        details: { updatedFields: Object.keys(req.body) },
        ipAddress: req.ip
    });
    await task.populate('assignees', 'name profilePictureUrl');
    await task.populate('attachments', 'title fileUrl');
    return task;
};

/**
 * Delete a task (creator or super‑admin).
 */
const deleteTask = async (req) => {
    const task = await Task.findById(req.params.id);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    if (task.creator.toString() !== req.user.id.toString() && req.user.role !== 'super-admin') {
        const err = new Error('Not authorized to delete this task');
        err.status = 403;
        throw err;
    }
    await createAuditLog({
        actor: req.user.id,
        action: 'TASK_DELETED',
        target: { id: task._id, type: 'Task' },
        details: { title: task.title },
        ipAddress: req.ip
    });
    await Task.findByIdAndDelete(task._id);
    return { message: 'Task deleted' };
};

/**
 * Add a comment to a task.
 * Returns the task.comments array after population.
 */
const addComment = async (req) => {
    const { text } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === req.user.id.toString();
    const isAssignee = task.assignees.some(id => id.toString() === req.user.id.toString());
    if (!isCreator && !isAssignee) {
        const err = new Error('You are not authorized to comment on this task.');
        err.status = 403;
        throw err;
    }
    task.comments.push({ text, author: req.user.id });
    await task.save();
    await createAuditLog({
        actor: req.user.id,
        action: 'TASK_COMMENT_ADDED',
        target: { id: task._id, type: 'Task' },
        details: { comment: text.substring(0, 50) + '...' },
        ipAddress: req.ip
    });
    await createNotification({
        taskId: task._id,
        sender: req.user.id,
        message: `${req.user.name} commented on the task: "${task.title}"`,
        link: '/tasks',
        type: 'Task',
    }, req);
    await task.populate('comments.author', 'name profilePictureUrl');
    return task.comments;
};

/**
 * Add an attachment to a task.
 * Returns the task.attachments array after population.
 */
const addAttachment = async (req) => {
    const { url, originalName } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === req.user.id.toString();
    const isAssignee = task.assignees.some(id => id.toString() === req.user.id.toString());
    if (!isCreator && !isAssignee) {
        const err = new Error('You are not authorized to add attachments to this task.');
        err.status = 403;
        throw err;
    }
    const newDocument = await Document.create({
        title: originalName,
        fileUrl: url,
        category: 'Task Attachment',
        uploadedBy: req.user.id
    });
    task.attachments.push(newDocument._id);
    await task.save();
    await createAuditLog({
        actor: req.user.id,
        action: 'TASK_ATTACHMENT_ADDED',
        target: { id: task._id, type: 'Task' },
        details: { documentId: newDocument._id, filename: originalName },
        ipAddress: req.ip
    });
    await task.populate('attachments', 'title fileUrl');
    return task.attachments;
};

/**
 * Placeholder for other task operations – currently unimplemented.
 */
const notImplemented = async (name) => {
    const err = new Error(`${name} not yet implemented in taskService.`);
    err.status = 501;
    throw err;
};

module.exports = {
    createTask,
    createSubTask,
    getTaskById,
    getMyTasks,
    getTeamTasks,
    getAllTasks,
    updateTask,
    deleteTask,
    // Stubs for remaining controller functions – replace when needed
    addComment,
    addAttachment,
    updateTaskStatus: (req) => notImplemented('updateTaskStatus'),
    requestTaskReopen: (req) => notImplemented('requestTaskReopen'),
    resolveTaskReopen: (req) => notImplemented('resolveTaskReopen'),
    updateTaskDependencies: (req) => notImplemented('updateTaskDependencies'),
    logTimeToTask: (req) => notImplemented('logTimeToTask'),
    toggleTaskSubscription: (req) => notImplemented('toggleTaskSubscription'),
    getTasksCreatedByMe: (req) => notImplemented('getTasksCreatedByMe'),
};
