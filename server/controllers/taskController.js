const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');

exports.createTask = asyncHandler(async (req, res) => {
    const { title, description, priority, assignees, dueDate, attachments, timeEstimate, customFieldValues } = req.body;
    const task = await taskService.createTask({
        title, description, priority, assignees, dueDate, attachments, timeEstimate, customFieldValues,
        userId: req.user.id, userName: req.user.name, userRole: req.user.systemRole, userManagerId: req.user.manager, ip: req.ip,
    });
    res.status(201).json({ success: true, data: task });
});

exports.createSubTask = asyncHandler(async (req, res) => {
    const { title, assignees } = req.body;
    const subTask = await taskService.createSubTask({
        taskId: req.params.id, title, assignees, userId: req.user.id, userRole: req.user.systemRole, ip: req.ip,
    });
    res.status(201).json({ success: true, data: subTask });
});

exports.getTaskById = asyncHandler(async (req, res) => {
    const task = await taskService.getTaskById({ taskId: req.params.id, userId: req.user.id, userRole: req.user.systemRole });
    res.status(200).json({ success: true, data: task });
});

exports.getMyTasks = asyncHandler(async (req, res) => {
    const { tasks, totalTasks, page, limit } = await taskService.getMyTasks({ userId: req.user.id, query: req.query });
    res.status(200).json({
        success: true, count: tasks.length,
        pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
        data: tasks,
    });
});

exports.getTeamTasks = asyncHandler(async (req, res) => {
    const { tasks, totalTasks, page, limit } = await taskService.getTeamTasks({ userId: req.user.id, query: req.query });
    res.status(200).json({
        success: true, count: tasks.length,
        pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
        data: tasks,
    });
});

exports.updateTask = asyncHandler(async (req, res) => {
    const task = await taskService.updateTask({ taskId: req.params.id, userId: req.user.id, userRole: req.user.systemRole, ip: req.ip, body: req.body });
    res.status(200).json({ success: true, data: task });
});

exports.updateTaskStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const task = await taskService.updateTaskStatus({ taskId: req.params.id, status, userId: req.user.id, userName: req.user.name, userRole: req.user.systemRole, ip: req.ip });
    res.status(200).json({ success: true, data: task });
});

exports.deleteTask = asyncHandler(async (req, res) => {
    const result = await taskService.deleteTask({ taskId: req.params.id, userId: req.user.id, userRole: req.user.systemRole, ip: req.ip });
    res.status(200).json({ success: true, message: result.message });
});

exports.getTasksCreatedByMe = asyncHandler(async (req, res) => {
    const { tasks, totalTasks, page, limit } = await taskService.getTasksCreatedByMe({ userId: req.user.id, query: req.query });
    res.status(200).json({
        success: true, count: tasks.length,
        pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
        data: tasks,
    });
});

exports.getAllTasks = asyncHandler(async (req, res) => {
    const { tasks, totalTasks, page, limit } = await taskService.getAllTasks({ query: req.query });
    res.status(200).json({
        success: true, count: tasks.length,
        pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
        data: tasks,
    });
});

exports.addComment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const comments = await taskService.addComment({ taskId: req.params.id, text, userId: req.user.id, userName: req.user.name, ip: req.ip });
    res.status(201).json({ success: true, data: comments });
});

exports.addAttachment = asyncHandler(async (req, res) => {
    const { url, originalName } = req.body;
    const attachments = await taskService.addAttachment({ taskId: req.params.id, url, originalName, userId: req.user.id, ip: req.ip });
    res.status(201).json({ success: true, data: attachments });
});

exports.requestTaskReopen = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const result = await taskService.requestTaskReopen({ taskId: req.params.id, reason, userId: req.user.id, userName: req.user.name, ip: req.ip });
    res.status(200).json({ success: true, ...result });
});

exports.resolveTaskReopen = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const result = await taskService.resolveTaskReopen({ requestId: req.params.requestId, status, userId: req.user.id, userName: req.user.name, userRole: req.user.systemRole, ip: req.ip });
    res.status(200).json({ success: true, ...result });
});

exports.updateTaskDependencies = asyncHandler(async (req, res) => {
    const { dependsOn } = req.body;
    const updatedTask = await taskService.updateTaskDependencies({ taskId: req.params.id, dependsOn, userId: req.user.id });
    res.status(200).json({ success: true, data: updatedTask });
});

exports.logTimeToTask = asyncHandler(async (req, res) => {
    const { timeSpent, date, notes } = req.body;
    const task = await taskService.logTimeToTask({ taskId: req.params.id, timeSpent, date, notes, userId: req.user.id, ip: req.ip });
    res.status(200).json({ success: true, data: task });
});

exports.toggleTaskSubscription = asyncHandler(async (req, res) => {
    const result = await taskService.toggleTaskSubscription({ taskId: req.params.id, userId: req.user.id });
    res.status(200).json({ success: true, message: result.message, data: result.task });
});

exports.getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await taskService.getTaskDashboard(req.user.id);
    res.status(200).json({ success: true, data: dashboard });
});

exports.getMyTaskSummary = asyncHandler(async (req, res) => {
    const summary = await taskService.getTaskSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
});

exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
    const { taskIds, status } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ success: false, message: 'taskIds array is required.' });
    }
    const result = await taskService.bulkUpdateStatus(taskIds, status, req.user.id);
    res.status(200).json({ success: true, ...result });
});

exports.bulkAssign = asyncHandler(async (req, res) => {
    const { taskIds, assigneeId } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0 || !assigneeId) {
        return res.status(400).json({ success: false, message: 'taskIds array and assigneeId are required.' });
    }
    const result = await taskService.bulkAssign(taskIds, assigneeId, req.user.id);
    res.status(200).json({ success: true, ...result });
});

exports.bulkDelete = asyncHandler(async (req, res) => {
    const { taskIds } = req.body;
    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        return res.status(400).json({ success: false, message: 'taskIds array is required.' });
    }
    const result = await taskService.bulkDelete(taskIds, req.user.id);
    res.status(200).json({ success: true, ...result });
});

exports.getActivityFeed = asyncHandler(async (req, res) => {
    const feed = await taskService.getTaskActivityFeed(req.params.id, req.user.id);
    res.status(200).json({ success: true, data: feed });
});

exports.exportCSV = asyncHandler(async (req, res) => {
    const csv = await taskService.exportTasksCSV(req.user.id, req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    res.status(200).send(csv);
});

exports.getKanbanBoard = asyncHandler(async (req, res) => {
    const board = await taskService.getKanbanBoard(req.user.id, req.query);
    res.status(200).json({ success: true, data: board });
});

exports.setRecurrence = asyncHandler(async (req, res) => {
    const { isRecurring, recurrenceInterval } = req.body;
    const task = await taskService.setTaskRecurrence({ taskId: req.params.id, isRecurring, recurrenceInterval, userId: req.user.id, userRole: req.user.systemRole, ip: req.ip });
    res.status(200).json({ success: true, data: task });
});
