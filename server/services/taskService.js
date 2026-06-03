const mongoose = require('mongoose');
const Task = require('../model/task.model');
const User = require('../model/user');
const Document = require('../model/Document');
const AuditLog = require('../model/AuditLog');
const { createAuditLog } = require('./auditLogService');
const { createNotification } = require('./notificationService');
const { getDescendantIds } = require('../utils/teamTree');

const buildTaskQuery = (baseQuery, queryParams) => {
    let query = { ...baseQuery };
    const { status, priority, assignee, search } = queryParams;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee && mongoose.Types.ObjectId.isValid(assignee)) query.assignees = assignee;
    if (search) query.title = { $regex: search, $options: 'i' };
    return query;
};

const createTask = async ({ title, description, priority, assignees, dueDate, attachments, timeEstimate, customFieldValues, userId, userName, userRole, userManagerId, ip }) => {
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

    for (const assigneeDoc of assigneeDocs) {
        let isAuthorized = false;
        const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
        const creatorRoleIndex = roleHierarchy.indexOf(userRole);
        const assigneeRoleIndex = roleHierarchy.indexOf(assigneeDoc.systemRole);
        if (userRole === 'employee' && userManagerId?.toString() === assigneeDoc._id.toString()) { isAuthorized = true; }
        if (userRole === 'manager') {
            const isDirectReport = assigneeDoc.manager?.toString() === userId;
            const isAssigneeHr = assigneeDoc.systemRole === 'hr';
            if (isDirectReport || isAssigneeHr) { isAuthorized = true; }
        }
        if (userRole === 'hr' || userRole === 'super-admin') {
            if (assigneeRoleIndex <= creatorRoleIndex && userId !== assigneeDoc._id.toString()) { isAuthorized = true; }
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
        creator: userId,
        timeEstimate: timeEstimate || 0,
        attachments: [],
        customFieldValues: customFieldValues || [],
    };

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
        const documentPromises = attachments.map(att => Document.create({
            title: att.originalName,
            fileUrl: att.url,
            category: 'Task Attachment',
            uploadedBy: userId,
        }));
        const createdDocuments = await Promise.all(documentPromises);
        taskData.attachments = createdDocuments.map(doc => doc._id);
    }

    const task = await Task.create(taskData);

    await createAuditLog({
        actor: userId,
        action: 'TASK_CREATED',
        target: { id: task._id, type: 'Task' },
        details: {
            title: task.title,
            assignedTo: assigneeDocs.map(d => d.name).join(', '),
            attachmentsCount: task.attachments.length,
            timeEstimate: task.timeEstimate,
        },
        ipAddress: ip,
    });

    await createNotification({
        taskId: task._id,
        sender: userId,
        message: `${userName} assigned you a new task: "${title}"`,
        link: '/tasks',
        type: 'Task',
    });

    await task.populate('assignees', 'name profilePictureUrl');
    await task.populate('attachments', 'title fileUrl');
    return task;
};

const createSubTask = async ({ taskId, title, assignees, userId, userRole, ip }) => {
    const parentTask = await Task.findById(taskId);
    if (!parentTask) {
        const err = new Error('Parent task not found.');
        err.status = 404;
        throw err;
    }
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
    const isCreator = parentTask.creator.toString() === userId;
    const isAssignee = parentTask.assignees.some(id => id.toString() === userId);
    if (!isCreator && !isAssignee && userRole !== 'super-admin') {
        const err = new Error('You are not authorized to add sub‑tasks to this parent task.');
        err.status = 403;
        throw err;
    }
    const subTask = await Task.create({
        title,
        assignees,
        creator: userId,
        parentTask: parentTask._id,
        priority: parentTask.priority,
        dueDate: parentTask.dueDate,
    });
    parentTask.subTasks.push(subTask._id);
    await parentTask.save();
    await createAuditLog({
        actor: userId,
        action: 'SUBTASK_CREATED',
        target: { id: subTask._id, type: 'Task' },
        details: { title: subTask.title, parent: parentTask.title },
        ipAddress: ip,
    });
    await subTask.populate('assignees', 'name profilePictureUrl');
    return subTask;
};

const getTaskById = async ({ taskId, userId, userRole }) => {
    const task = await Task.findById(taskId)
        .populate('creator', 'name')
        .populate('assignees', 'name profilePictureUrl manager')
        .populate('attachments', 'title fileUrl')
        .populate({ path: 'comments', populate: { path: 'author', select: 'name profilePictureUrl' } })
        .populate({ path: 'customFieldValues', populate: { path: 'field', model: 'CustomField' } })
        .populate({
            path: 'subTasks',
            select: 'title status assignees',
            populate: { path: 'assignees', select: 'name profilePictureUrl' },
        })
        .lean();
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator._id.toString() === userId;
    const isAssignee = task.assignees.some(a => a._id.toString() === userId);
    const isManagerOfAssignee = task.assignees.some(a => a.manager?.toString() === userId);
    if (!isCreator && !isAssignee && !isManagerOfAssignee) {
        if (userRole !== 'super-admin' && userRole !== 'hr') {
            const err = new Error('Not authorized to view this task');
            err.status = 403;
            throw err;
        }
    }
    return task;
};

const getMyTasks = async ({ userId, query }) => {
    const baseQuery = { assignees: userId };
    const finalQuery = buildTaskQuery(baseQuery, query);
    const sortBy = query.sortBy || 'dueDate';
    const order = query.order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
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
        Task.countDocuments(finalQuery),
    ]);
    return { tasks, totalTasks, page, limit };
};

const getTeamTasks = async ({ userId, query }) => {
    const teamMemberIds = await getDescendantIds(userId);
    const baseQuery = { assignees: { $in: teamMemberIds } };
    const finalQuery = buildTaskQuery(baseQuery, query);
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
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
        Task.countDocuments(finalQuery),
    ]);
    return { tasks, totalTasks, page, limit };
};

const getAllTasks = async ({ query }) => {
    const baseQuery = {};
    const finalQuery = buildTaskQuery(baseQuery, query);
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 15;
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
        Task.countDocuments(finalQuery),
    ]);
    return { tasks, totalTasks, page, limit };
};

const updateTask = async ({ taskId, body, userId, userRole, ip }) => {
    let task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === userId;
    if (!isCreator && userRole !== 'super-admin' && userRole !== 'hr') {
        const err = new Error('Not authorized to edit this task details.');
        err.status = 403;
        throw err;
    }
    const allowedFields = ['title', 'description', 'priority', 'dueDate', 'timeEstimate', 'assignees', 'customFieldValues'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            filteredUpdates[field] = body[field];
        }
    });
    task = await Task.findByIdAndUpdate(taskId, filteredUpdates, { new: true, runValidators: true });
    await createAuditLog({
        actor: userId,
        action: 'TASK_UPDATED',
        target: { id: task._id, type: 'Task' },
        details: { updatedFields: Object.keys(body) },
        ipAddress: ip,
    });
    await task.populate('assignees', 'name profilePictureUrl');
    await task.populate('attachments', 'title fileUrl');
    return task;
};

const deleteTask = async ({ taskId, userId, userRole, ip }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    if (task.creator.toString() !== userId) {
        if (userRole !== 'super-admin') {
            const err = new Error('Not authorized to delete this task');
            err.status = 403;
            throw err;
        }
    }
    await createAuditLog({
        actor: userId,
        action: 'TASK_DELETED',
        target: { id: task._id, type: 'Task' },
        details: { title: task.title },
        ipAddress: ip,
    });
    await Task.findByIdAndDelete(task._id);
    return { message: 'Task deleted' };
};

const addComment = async ({ taskId, text, userId, userName, ip }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === userId;
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    if (!isCreator && !isAssignee) {
        const err = new Error('You are not authorized to comment on this task.');
        err.status = 403;
        throw err;
    }
    task.comments.push({ text, author: userId });
    await task.save();
    await createAuditLog({
        actor: userId,
        action: 'TASK_COMMENT_ADDED',
        target: { id: task._id, type: 'Task' },
        details: { comment: text.substring(0, 50) + '...' },
        ipAddress: ip,
    });
    await createNotification({
        taskId: task._id,
        sender: userId,
        message: `${userName} commented on the task: "${task.title}"`,
        link: '/tasks',
        type: 'Task',
    });
    await task.populate('comments.author', 'name profilePictureUrl');
    return task.comments;
};

const addAttachment = async ({ taskId, url, originalName, userId, ip }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === userId;
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    if (!isCreator && !isAssignee) {
        const err = new Error('You are not authorized to add attachments to this task.');
        err.status = 403;
        throw err;
    }
    const newDocument = await Document.create({
        title: originalName,
        fileUrl: url,
        category: 'Task Attachment',
        uploadedBy: userId,
    });
    task.attachments.push(newDocument._id);
    await task.save();
    await createAuditLog({
        actor: userId,
        action: 'TASK_ATTACHMENT_ADDED',
        target: { id: task._id, type: 'Task' },
        details: { documentId: newDocument._id, filename: originalName },
        ipAddress: ip,
    });
    await task.populate('attachments', 'title fileUrl');
    return task.attachments;
};

const updateTaskStatus = async ({ taskId, status: newStatus, userId, userName, userRole, ip }) => {
    const task = await Task.findById(taskId).populate('dependsOn', 'status');
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    if (['In Progress', 'Done'].includes(newStatus)) {
        const openDependencies = task.dependsOn.filter(dep => dep.status !== 'Done');
        if (openDependencies.length > 0) {
            if (task.status !== 'Blocked') {
                task.status = 'Blocked';
                await task.save();
            }
            const err = new Error(`Cannot start task. It is blocked by ${openDependencies.length} open task(s).`);
            err.status = 400;
            throw err;
        }
    }
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    const isCreator = task.creator.toString() === userId;
    const isAdmin = userRole === 'super-admin' || userRole === 'hr';
    if (task.status === 'Done') {
        if (!isCreator && !isAdmin) {
            const err = new Error('Task is complete. Assignees must request to re-open.');
            err.status = 403;
            throw err;
        }
    } else {
        if (!isAssignee && !isCreator && !isAdmin) {
            const err = new Error('You are not authorized to update the status of this task.');
            err.status = 403;
            throw err;
        }
    }
    const oldStatus = task.status;
    task.status = newStatus;
    await task.save();
    if (oldStatus !== 'Done' && newStatus === 'Done') {
        const tasksToUnblock = await Task.find({ _id: { $in: task.blocking } }).populate('dependsOn', 'status');
        for (const taskToUpdate of tasksToUnblock) {
            const canBeUnblocked = taskToUpdate.dependsOn.every(dep => dep.status === 'Done');
            if (canBeUnblocked) {
                taskToUpdate.status = 'To Do';
                await taskToUpdate.save();
            }
        }
    }
    await createAuditLog({
        actor: userId,
        action: 'TASK_STATUS_UPDATED',
        target: { id: task._id, type: 'Task' },
        details: { title: task.title, from: oldStatus, to: newStatus },
        ipAddress: ip,
    });
    if (task.status === 'Done' && !isCreator) {
        await createNotification({
            taskId: task._id,
            sender: userId,
            message: `${userName} completed the task: "${task.title}"`,
            link: '/tasks',
            type: 'Task',
        });
    } else if (oldStatus === 'Done' && task.status !== 'Done') {
        await createNotification({
            taskId: task._id,
            sender: userId,
            message: `${userName} re-opened the task: "${task.title}"`,
            link: '/tasks',
            type: 'Task',
        });
    }
    await task.populate('assignees', 'name profilePictureUrl');
    await task.populate('attachments', 'title fileUrl');
    return task;
};

const logTimeToTask = async ({ taskId, timeSpent, date, notes, userId, ip }) => {
    if (!timeSpent || !date) {
        const err = new Error('Time spent and date are required.');
        err.status = 400;
        throw err;
    }
    if (timeSpent <= 0 || timeSpent > 24) {
        const err = new Error('Time spent must be between 0 and 24 hours.');
        err.status = 400;
        throw err;
    }
    if (new Date(date) > new Date()) {
        const err = new Error('Cannot log time for future dates.');
        err.status = 400;
        throw err;
    }
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found.');
        err.status = 404;
        throw err;
    }
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    if (!isAssignee) {
        const err = new Error('Only an assignee can log time on this task.');
        err.status = 403;
        throw err;
    }
    task.timeLogs.push({ user: userId, timeSpent: parseFloat(timeSpent), date, notes });
    task.totalTimeSpent = task.timeLogs.reduce((acc, log) => acc + log.timeSpent, 0);
    await task.save();
    await createAuditLog({
        actor: userId, action: 'TASK_TIME_LOGGED',
        target: { id: task._id, type: 'Task' },
        details: { timeSpent: `${timeSpent}h, total: ${task.totalTimeSpent}h` },
        ipAddress: ip,
    });
    return task;
};

const updateTaskDependencies = async ({ taskId, dependsOn: newDependencyIds, userId }) => {
    const currentTask = await Task.findById(taskId);
    if (!currentTask) {
        const err = new Error('Task not found.');
        err.status = 404;
        throw err;
    }
    const isCreator = currentTask.creator.toString() === userId;
    const isAssignee = currentTask.assignees.some(id => id.toString() === userId);
    if (!isCreator && !isAssignee) {
        const err = new Error('Not authorized to manage dependencies for this task.');
        err.status = 403;
        throw err;
    }
    const hasCycle = async (taskId, dependsOnIds) => {
        const visited = new Set();
        const queue = [...dependsOnIds.map(id => id.toString())];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current === taskId.toString()) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            const depTask = await Task.findById(current).select('dependsOn').lean();
            if (depTask && depTask.dependsOn) {
                queue.push(...depTask.dependsOn.map(id => id.toString()));
            }
        }
        return false;
    };
    if (await hasCycle(currentTask._id, newDependencyIds)) {
        const err = new Error('Adding these dependencies would create a circular dependency.');
        err.status = 400;
        throw err;
    }
    const oldDependencyIds = currentTask.dependsOn.map(id => id.toString());
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        currentTask.dependsOn = newDependencyIds;
        await currentTask.save({ session });
        const idsToRemoveFrom = oldDependencyIds.filter(id => !newDependencyIds.includes(id));
        if (idsToRemoveFrom.length > 0) {
            await Task.updateMany(
                { _id: { $in: idsToRemoveFrom } },
                { $pull: { blocking: currentTask._id } },
                { session },
            );
        }
        const idsToAddTo = newDependencyIds.filter(id => !oldDependencyIds.includes(id));
        if (idsToAddTo.length > 0) {
            await Task.updateMany(
                { _id: { $in: idsToAddTo } },
                { $addToSet: { blocking: currentTask._id } },
                { session },
            );
        }
    });
    session.endSession();
    const updatedTask = await Task.findById(taskId).populate('dependsOn', 'title status');
    return updatedTask;
};

const requestTaskReopen = async ({ taskId, reason, userId, userName, ip }) => {
    if (!reason) {
        const err = new Error('A reason is required to request re-opening.');
        err.status = 400;
        throw err;
    }
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found.');
        err.status = 404;
        throw err;
    }
    if (task.status !== 'Done') {
        const err = new Error('Only completed tasks can be requested to re-open.');
        err.status = 400;
        throw err;
    }
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    if (!isAssignee) {
        const err = new Error('Only an assignee can make this request.');
        err.status = 403;
        throw err;
    }
    task.reopenRequests.push({ requestedBy: userId, reason });
    await task.save();
    await createAuditLog({
        actor: userId, action: 'TASK_REOPEN_REQUESTED',
        target: { id: task._id, type: 'Task' },
        details: { reason }, ipAddress: ip,
    });
    await createNotification({
        recipient: task.creator, sender: userId,
        message: `${userName} requested to re-open task: "${task.title}"`,
        link: '/tasks', type: 'Task',
    });
    return { message: 'Re-open request submitted successfully.' };
};

const resolveTaskReopen = async ({ requestId, status, userId, userName, userRole, ip }) => {
    if (!['Approved', 'Rejected'].includes(status)) {
        const err = new Error('Invalid resolution status.');
        err.status = 400;
        throw err;
    }
    const task = await Task.findOne({ 'reopenRequests._id': requestId });
    if (!task) {
        const err = new Error('Re-open request not found.');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === userId;
    if (!isCreator && userRole !== 'super-admin' && userRole !== 'hr') {
        const err = new Error('Only the task creator can resolve this request.');
        err.status = 403;
        throw err;
    }
    const request = task.reopenRequests.id(requestId);
    if (request.status !== 'Pending') {
        const err = new Error('This request has already been resolved.');
        err.status = 400;
        throw err;
    }
    request.status = status;
    request.resolvedBy = userId;
    request.resolvedAt = Date.now();
    let messageForNotification = '';
    if (status === 'Approved') {
        task.status = 'In Progress';
        messageForNotification = `${userName} approved your request to re-open: "${task.title}"`;
    } else {
        messageForNotification = `${userName} rejected your request to re-open: "${task.title}"`;
    }
    await task.save();
    await createAuditLog({
        actor: userId, action: `TASK_REOPEN_${status.toUpperCase()}`,
        target: { id: task._id, type: 'Task' },
        details: { requestId }, ipAddress: ip,
    });
    await createNotification({
        recipient: request.requestedBy, sender: userId,
        message: messageForNotification, link: '/tasks', type: 'Task',
    });
    return { message: `Request has been ${status.toLowerCase()}.` };
};

const toggleTaskSubscription = async ({ taskId, userId }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found.');
        err.status = 404;
        throw err;
    }
    const isSubscribed = task.subscribers.some(subscriberId => subscriberId.toString() === userId);
    let message = '';
    if (isSubscribed) {
        await Task.updateOne({ _id: task._id }, { $pull: { subscribers: userId } });
        message = 'You have unsubscribed from this task.';
    } else {
        await Task.updateOne({ _id: task._id }, { $addToSet: { subscribers: userId } });
        message = 'You are now subscribed to this task.';
    }
    const updatedTask = await Task.findById(taskId);
    return { task: updatedTask, message };
};

const computeNextDueDate = (interval, fromDate) => {
    const next = new Date(fromDate);
    switch (interval) {
        case 'daily': next.setDate(next.getDate() + 1); break;
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
};

const bulkUpdateStatus = async (taskIds, status, userId) => {
    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length !== taskIds.length) {
        const err = new Error('One or more tasks not found.');
        err.status = 404;
        throw err;
    }
    const authorizedIds = tasks
        .filter(t => {
            const isAssignee = t.assignees.some(id => id.toString() === userId);
            const isCreator = t.creator.toString() === userId;
            return isAssignee || isCreator;
        })
        .map(t => t._id);
    if (authorizedIds.length === 0) {
        const err = new Error('You are not authorized to update any of these tasks.');
        err.status = 403;
        throw err;
    }
    await Task.updateMany(
        { _id: { $in: authorizedIds } },
        { $set: { status } },
    );
    return { updatedCount: authorizedIds.length, skippedCount: taskIds.length - authorizedIds.length };
};

const bulkAssign = async (taskIds, assigneeId, userId) => {
    const assignee = await User.findById(assigneeId);
    if (!assignee) {
        const err = new Error('Assignee not found.');
        err.status = 404;
        throw err;
    }
    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length !== taskIds.length) {
        const err = new Error('One or more tasks not found.');
        err.status = 404;
        throw err;
    }
    const authorizedIds = tasks
        .filter(t => {
            const isCreator = t.creator.toString() === userId;
            return isCreator || userId === 'super-admin';
        })
        .map(t => t._id);
    if (authorizedIds.length === 0) {
        const err = new Error('You are not authorized to reassign any of these tasks.');
        err.status = 403;
        throw err;
    }
    await Task.updateMany(
        { _id: { $in: authorizedIds } },
        { $addToSet: { assignees: assigneeId } },
    );
    return { updatedCount: authorizedIds.length, skippedCount: taskIds.length - authorizedIds.length };
};

const bulkDelete = async (taskIds, userId) => {
    const tasks = await Task.find({ _id: { $in: taskIds } });
    if (tasks.length !== taskIds.length) {
        const err = new Error('One or more tasks not found.');
        err.status = 404;
        throw err;
    }
    const authorizedIds = tasks
        .filter(t => {
            const isCreator = t.creator.toString() === userId;
            return isCreator;
        })
        .map(t => t._id);
    if (authorizedIds.length === 0) {
        const err = new Error('You are not authorized to delete any of these tasks.');
        err.status = 403;
        throw err;
    }
    await Task.deleteMany({ _id: { $in: authorizedIds } });
    return { deletedCount: authorizedIds.length, skippedCount: taskIds.length - authorizedIds.length };
};

const getTaskDashboard = async (userId) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalTasks, completed30d, overdueTasks, allTasks] = await Promise.all([
        Task.countDocuments({ assignees: userId }),
        Task.countDocuments({ assignees: userId, status: 'Done', updatedAt: { $gte: thirtyDaysAgo } }),
        Task.countDocuments({ assignees: userId, dueDate: { $lt: now }, status: { $ne: 'Done' } }),
        Task.find({ assignees: userId }).select('status priority dueDate totalTimeSpent').lean(),
    ]);

    const byPriority = { Low: 0, Medium: 0, High: 0 };
    const byStatus = { 'To Do': 0, 'In Progress': 0, Done: 0, Blocked: 0 };
    let totalTimeSpent = 0;

    for (const t of allTasks) {
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        totalTimeSpent += t.totalTimeSpent || 0;
    }

    const weeklyCompletions = await Task.aggregate([
        { $match: { assignees: userId, status: 'Done', updatedAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $week: '$updatedAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } },
    ]);

    return {
        totalTasks,
        completedLast30Days: completed30d,
        overdueTasks,
        totalTimeSpent: Math.round(totalTimeSpent * 100) / 100,
        byPriority,
        byStatus,
        weeklyCompletions,
    };
};

const getTaskActivityFeed = async (taskId, userId) => {
    const task = await Task.findById(taskId)
        .select('comments timeLogs reopenRequests title')
        .populate('comments.author', 'name')
        .populate('timeLogs.user', 'name')
        .lean();
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }

    const auditLogs = await AuditLog.find({ 'target.id': task._id, 'target.type': 'Task' })
        .populate('actor', 'name')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    const embeddedEvents = [];
    for (const c of task.comments || []) {
        embeddedEvents.push({
            type: 'comment',
            actor: c.author,
            description: `commented: "${c.text.substring(0, 80)}"`,
            createdAt: c.createdAt,
        });
    }
    for (const t of task.timeLogs || []) {
        embeddedEvents.push({
            type: 'time_log',
            actor: t.user,
            description: `logged ${t.timeSpent}h`,
            createdAt: t.createdAt,
        });
    }
    for (const r of task.reopenRequests || []) {
        embeddedEvents.push({
            type: 'reopen_request',
            actor: { _id: r.requestedBy, name: 'Unknown' },
            description: `requested re-open: "${r.reason.substring(0, 80)}" (${r.status})`,
            createdAt: r.createdAt,
        });
    }

    const formattedAudit = auditLogs.map(a => ({
        type: 'audit',
        actor: a.actor,
        action: a.action,
        description: a.details?.title
            ? `${a.action.replace('TASK_', '').replace(/_/g, ' ').toLowerCase()} for "${a.details.title}"`
            : a.action.replace(/_/g, ' ').toLowerCase(),
        details: a.details,
        createdAt: a.createdAt,
    }));

    const feed = [...formattedAudit, ...embeddedEvents]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return feed;
};

const exportTasksCSV = async (userId, queryParams) => {
    const filter = { assignees: userId };
    const { status, priority } = queryParams;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
        .populate('assignees', 'name')
        .populate('creator', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Title,Status,Priority,Assignees,Creator,Due Date,Created At,Time Estimate,Time Spent\n';
    const rows = tasks.map(t => {
        const assignees = (t.assignees || []).map(a => a.name).join('; ');
        const dueDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '';
        const createdAt = new Date(t.createdAt).toISOString().split('T')[0];
        return `"${t.title}",${t.status},${t.priority},"${assignees}","${t.creator?.name || ''}",${dueDate},${createdAt},${t.timeEstimate || 0},${t.totalTimeSpent || 0}`;
    }).join('\n');

    return header + rows;
};

const setTaskRecurrence = async ({ taskId, isRecurring, recurrenceInterval, userId, ip }) => {
    const task = await Task.findById(taskId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const isCreator = task.creator.toString() === userId;
    const isAssignee = task.assignees.some(id => id.toString() === userId);
    if (!isCreator && !isAssignee && userRole !== 'super-admin' && userRole !== 'hr') {
        const err = new Error('Not authorized to set recurrence on this task.');
        err.status = 403;
        throw err;
    }
    task.isRecurring = isRecurring;
    if (isRecurring) {
        task.recurrenceInterval = recurrenceInterval || 'weekly';
        task.nextDueDate = task.dueDate || computeNextDueDate(task.recurrenceInterval, new Date());
    } else {
        task.recurrenceInterval = undefined;
        task.nextDueDate = undefined;
    }
    await task.save();
    await createAuditLog({
        actor: userId, action: 'TASK_RECURRENCE_UPDATED',
        target: { id: task._id, type: 'Task' },
        details: { isRecurring, recurrenceInterval: task.recurrenceInterval },
        ipAddress: ip,
    });
    return task;
};

const getKanbanBoard = async (userId, queryParams) => {
    const filter = { assignees: userId };
    const { priority, search } = queryParams;
    if (priority) filter.priority = priority;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
        .select('title status priority dueDate assignees')
        .populate('assignees', 'name profilePictureUrl')
        .sort({ priority: -1, dueDate: 1 })
        .lean();

    const board = {
        todo: tasks.filter(t => t.status === 'To Do'),
        inProgress: tasks.filter(t => t.status === 'In Progress'),
        done: tasks.filter(t => t.status === 'Done'),
        blocked: tasks.filter(t => t.status === 'Blocked'),
    };
    return board;
};

const getTaskSummary = async (userId) => {
    const [totalTasks, todoTasks, inProgressTasks, doneTasks, blockedTasks] = await Promise.all([
        Task.countDocuments({ assignees: userId }),
        Task.countDocuments({ assignees: userId, status: 'To Do' }),
        Task.countDocuments({ assignees: userId, status: 'In Progress' }),
        Task.countDocuments({ assignees: userId, status: 'Done' }),
        Task.countDocuments({ assignees: userId, status: 'Blocked' }),
    ]);
    const overdueTasks = await Task.countDocuments({
        assignees: userId,
        dueDate: { $lt: new Date() },
        status: { $ne: 'Done' },
    });
    return { totalTasks, todoTasks, inProgressTasks, doneTasks, blockedTasks, overdueTasks };
};

const getTasksCreatedByMe = async ({ userId, query }) => {
    const baseQuery = { creator: userId };
    const finalQuery = buildTaskQuery(baseQuery, query);
    const sortBy = query.sortBy || 'createdAt';
    const order = query.order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: order };
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const [tasks, totalTasks] = await Promise.all([
        Task.find(finalQuery)
            .populate('assignees', 'name profilePictureUrl')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(finalQuery),
    ]);
    return { tasks, totalTasks, page, limit };
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
    addComment,
    addAttachment,
    updateTaskStatus,
    logTimeToTask,
    updateTaskDependencies,
    requestTaskReopen,
    resolveTaskReopen,
    toggleTaskSubscription,
    getTasksCreatedByMe,
    getTaskSummary,
    getKanbanBoard,
    setTaskRecurrence,
    exportTasksCSV,
    getTaskActivityFeed,
    getTaskDashboard,
    bulkUpdateStatus,
    bulkAssign,
    bulkDelete,
};
