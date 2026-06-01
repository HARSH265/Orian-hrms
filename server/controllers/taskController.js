// In: server/controllers/taskController.js

// =================================================================================
// UPGRADED TASK CONTROLLER
// Version: 2.3
// Changes:
// - V2.2: Multiple assignees, scalable lists, audit logs.
// - V2.3: Re-architected attachment logic to create and reference `Document` models.
// =================================================================================

const mongoose = require('mongoose');
const Task = require('../model/task.model');
const User = require('../model/user');
const Document = require('../model/Document'); // <-- IMPORT DOCUMENT MODEL
const { createNotification } = require('../services/notificationService');
const { createAuditLog } = require('../services/auditLogService');
const taskService = require('../services/taskService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * A helper function to build a dynamic query for task lists.
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


// @desc    Create a new sub-task under a parent task
// @route   POST /api/tasks/:id/subtasks
// @access  Private
exports.createSubTask = async (req, res, next) => {
    try {
        const subTask = await taskService.createSubTask(req);
        res.status(201).json({ success: true, data: subTask });
    } catch (error) {
        next(error);
    }
};


// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
    try {
        const task = await taskService.createTask(req);
        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};


// @desc    Get a single task by ID with full details
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(req);
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};


// @desc    Get all tasks assigned to the logged-in user
// @route   GET /api/tasks/my-tasks
// @access  Private
exports.getMyTasks = async (req, res, next) => {
    try {
        const { tasks, totalTasks, page, limit } = await taskService.getMyTasks(req);
        res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks assigned to the manager's team
// @route   GET /api/tasks/team-tasks
// @access  Private (Manager+)
// exports.getTeamTasks = async (req, res, next) => {
//     try {
//         const teamMembers = await User.find({ manager: req.user.id }).select('_id');
//         const teamMemberIds = teamMembers.map(member => member._id);
//         const baseQuery = { assignees: { $in: teamMemberIds } };
//         const finalQuery = buildTaskQuery(baseQuery, req.query);
        
//         const sortBy = req.query.sortBy || 'createdAt';
//         const order = req.query.order === 'asc' ? 1 : -1;
//         const sortOptions = { [sortBy]: order };
//         const page = parseInt(req.query.page, 10) || 1;
//         const limit = parseInt(req.query.limit, 10) || 10;
//         const skip = (page - 1) * limit;

//         const [tasks, totalTasks] = await Promise.all([
//             Task.find(finalQuery)
//                 .populate('assignees', 'name profilePictureUrl')
//                 .populate('creator', 'name')
//                 .populate('attachments', 'title fileUrl')
//                 .sort(sortOptions)
//                 .skip(skip)
//                 .limit(limit)
//                 .lean(),
//             Task.countDocuments(finalQuery)
//         ]);
        
//         res.status(200).json({
//             success: true,
//             count: tasks.length,
//             pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
//             data: tasks
//         });
//     } catch (error) {
//         next(error);
//     }
// };


exports.getTeamTasks = async (req, res, next) => {
    try {
        const { tasks, totalTasks, page, limit } = await taskService.getTeamTasks(req);
        res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};


// @desc    Update a task's details
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        const task = await taskService.updateTask(req);
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a task's status
// @route   PUT /api/tasks/:id/status
// @access  Private

exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status: newStatus } = req.body;
        // Populate dependencies to check them first
        let task = await Task.findById(req.params.id).populate('dependsOn', 'status'); 

        if (!task) { 
            return res.status(404).json({ success: false, message: 'Task not found' }); 
        }
        
        // Step 1 (Most Critical): Check if the task is blocked by its dependencies.
        if (['In Progress', 'Done'].includes(newStatus)) {
            const openDependencies = task.dependsOn.filter(dep => dep.status !== 'Done');
            if (openDependencies.length > 0) {
                if (task.status !== 'Blocked') {
                    task.status = 'Blocked';
                    await task.save();
                }
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot start task. It is blocked by ${openDependencies.length} open task(s).` 
                });
            }
        }
        
        // Step 2: Now that we know the task is not blocked, check if the USER has permission.
        const isAssignee = task.assignees.some(id => id.toString() === req.user.id.toString());
        const isCreator = task.creator.toString() === req.user.id.toString();
        const isAdmin = req.user.role === 'super-admin' || req.user.role === 'hr';

        if (task.status === 'Done') {
            // Re-open logic: only creator/admin can change a 'Done' task.
            if (!isCreator && !isAdmin) {
                return res.status(403).json({ success: false, message: 'Task is complete. Assignees must request to re-open.' });
            }
        } else {
            // Standard update logic: an assignee OR the creator OR an admin can change the status.
            if (!isAssignee && !isCreator && !isAdmin) {
                return res.status(403).json({ success: false, message: 'You are not authorized to update the status of this task.' });
            }
        }
        
        const oldStatus = task.status;
        task.status = newStatus;
        await task.save();
       
        // Auto-unblock downstream tasks if this one was just completed.
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
        
        // --- THIS AUDIT LOG ALREADY SAVES WHO CHANGED THE STATUS ---
        // The actor: req.user.id field automatically records the person
        // who made the API call, thus saving the history correctly.
        await createAuditLog({
            actor: req.user.id, 
            action: 'TASK_STATUS_UPDATED', 
            target: { id: task._id, type: 'Task' },
            details: { title: task.title, from: oldStatus, to: newStatus }, 
            ipAddress: req.ip
        });

        // --- Notification Logic ---
       if (task.status === 'Done' && !isCreator) {
            await createNotification({
                taskId: task._id,
                sender: req.user.id,
                message: `${req.user.name} completed the task: "${task.title}"`,
                link: '/tasks',
                type: 'Task',
            }, req);
        } else if (oldStatus === 'Done' && task.status !== 'Done') {
            await createNotification({
                taskId: task._id,
                sender: req.user.id,
                message: `${req.user.name} re-opened the task: "${task.title}"`,
                link: '/tasks',
                type: 'Task',
            }, req);
        }
        
        await task.populate('assignees', 'name profilePictureUrl');
        await task.populate('attachments', 'title fileUrl');
        res.status(200).json({ success: true, data: task });
        
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        const result = await taskService.deleteTask(req);
        res.status(200).json({ success: true, message: result.message });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks created by the logged-in user
// @route   GET /api/tasks/created-by-me
// @access  Private
exports.getTasksCreatedByMe = async (req, res, next) => {
    try {
        // Base query is for tasks created by the current user
        const baseQuery = { creator: req.user.id };
        const finalQuery = buildTaskQuery(baseQuery, req.query); // buildTaskQuery adds filters

        // Standard scalable logic
        const sortBy = req.query.sortBy || 'createdAt';
        const order = req.query.order === 'asc' ? 1 : -1;
        const sortOptions = { [sortBy]: order };
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 per page
        const skip = (page - 1) * limit;

        const [tasks, totalTasks] = await Promise.all([
            Task.find(finalQuery)
                .populate('assignees', 'name profilePictureUrl') // Changed from assignee to assignees
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean(),
            Task.countDocuments(finalQuery)
        ]);

        res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ALL tasks in the system for Admin view
// @route   GET /api/tasks/all
// @access  Private (HR, Super-Admin)
exports.getAllTasks = async (req, res, next) => {
    try {
        const { tasks, totalTasks, page, limit } = await taskService.getAllTasks(req);
        res.status(200).json({
            success: true,
            count: tasks.length,
            pagination: { total: totalTasks, page, pages: Math.ceil(totalTasks / limit) },
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add a comment to a task
// @route   POST /api/tasks/:id/comments
exports.addComment = asyncHandler(async (req, res) => {
    const comments = await taskService.addComment(req);
    res.status(201).json({ success: true, data: comments });
});

// @desc    Add an attachment to an existing task
// @route   POST /api/tasks/:id/attachments
exports.addAttachment = asyncHandler(async (req, res) => {
    const attachments = await taskService.addAttachment(req);
    res.status(201).json({ success: true, data: attachments });
});

// @desc    An assignee requests to re-open a completed task
// @route   POST /api/tasks/:id/reopen-requests
// @access  Private (Assignee only)
exports.requestTaskReopen = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ success: false, message: 'A reason is required to request re-opening.' });
        }

        const task = await Task.findById(req.params.id);
        if (!task) { return res.status(404).json({ success: false, message: 'Task not found.' }); }

        if (task.status !== 'Done') {
            return res.status(400).json({ success: false, message: 'Only completed tasks can be requested to re-open.' });
        }

        const isAssignee = task.assignees.some(id => id.toString() === req.user.id.toString());
        if (!isAssignee) {
            return res.status(403).json({ success: false, message: 'Only an assignee can make this request.' });
        }
        
        // Add the request to the task's history
        task.reopenRequests.push({ requestedBy: req.user.id, reason });
        await task.save();

        await createAuditLog({
            actor: req.user.id, action: 'TASK_REOPEN_REQUESTED', target: { id: task._id, type: 'Task' },
            details: { reason }, ipAddress: req.ip
        });

        await createNotification({
            recipient: task.creator, sender: req.user.id,
            message: `${req.user.name} requested to re-open task: "${task.title}"`,
            link: `/tasks`, // A better link would point to the task details
            type: 'Task',
        }, req);
        
        res.status(200).json({ success: true, message: 'Re-open request submitted successfully.' });

    } catch (error) {
        next(error);
    }
};

// @desc    A creator approves or rejects a re-open request
// @route   PUT /api/tasks/reopen-requests/:requestId
// @access  Private (Creator only)
exports.resolveTaskReopen = async (req, res, next) => {
    try {
        const { status } = req.body; // Expecting 'Approved' or 'Rejected'
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid resolution status.' });
        }

        // Find the task that contains the specific re-open request
        const task = await Task.findOne({ 'reopenRequests._id': req.params.requestId });
        if (!task) { return res.status(404).json({ success: false, message: 'Re-open request not found.' }); }

        const isCreator = task.creator.toString() === req.user.id.toString();
        if (!isCreator && req.user.role !== 'super-admin' && req.user.role !== 'hr') {
            return res.status(403).json({ success: false, message: 'Only the task creator can resolve this request.' });
        }

        const request = task.reopenRequests.id(req.params.requestId);
        if (request.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'This request has already been resolved.' });
        }

        // Update the request sub-document
        request.status = status;
        request.resolvedBy = req.user.id;
        request.resolvedAt = Date.now();
        
        let messageForNotification = '';

        if (status === 'Approved') {
            // If approved, change the main task status back to 'In Progress'
            task.status = 'In Progress';
            messageForNotification = `${req.user.name} approved your request to re-open: "${task.title}"`;
        } else {
            messageForNotification = `${req.user.name} rejected your request to re-open: "${task.title}"`;
        }

        await task.save();

        await createAuditLog({
            actor: req.user.id, action: `TASK_REOPEN_${status.toUpperCase()}`, target: { id: task._id, type: 'Task' },
            details: { requestId: req.params.requestId }, ipAddress: req.ip
        });

        await createNotification({
            recipient: request.requestedBy, sender: req.user.id,
            message: messageForNotification, link: `/tasks`, type: 'Task',
        }, req);
        
        res.status(200).json({ success: true, message: `Request has been ${status.toLowerCase()}.` });

    } catch (error) {
        next(error);
    }
};

exports.updateTaskDependencies = async (req, res, next) => {
    try {
        // The frontend will send the complete list of task IDs this task should depend on
        const { dependsOn: newDependencyIds } = req.body; 

        const currentTask = await Task.findById(req.params.id);
        if (!currentTask) { return res.status(404).json({ success: false, message: 'Task not found.'}); }

        // Security Check: Only creator/assignee can manage dependencies
        const isCreator = currentTask.creator.toString() === req.user.id.toString();
        const isAssignee = currentTask.assignees.some(id => id.toString() === req.user.id.toString());
        if (!isCreator && !isAssignee) {
             return res.status(403).json({ success: false, message: 'Not authorized to manage dependencies for this task.' });
        }

        const oldDependencyIds = currentTask.dependsOn.map(id => id.toString());
        
        // --- Transaction: This ensures all DB updates succeed or none do ---
        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
            // 1. Update the current task
            currentTask.dependsOn = newDependencyIds;
            await currentTask.save({ session });

            // 2. Remove this task from the 'blocking' list of old dependencies
            const idsToRemoveFrom = oldDependencyIds.filter(id => !newDependencyIds.includes(id));
            if (idsToRemoveFrom.length > 0) {
                await Task.updateMany(
                    { _id: { $in: idsToRemoveFrom } },
                    { $pull: { blocking: currentTask._id } },
                    { session }
                );
            }

            // 3. Add this task to the 'blocking' list of new dependencies
            const idsToAddTo = newDependencyIds.filter(id => !oldDependencyIds.includes(id));
            if (idsToAddTo.length > 0) {
                await Task.updateMany(
                    { _id: { $in: idsToAddTo } },
                    { $addToSet: { blocking: currentTask._id } }, // $addToSet prevents duplicates
                    { session }
                );
            }
        });
        session.endSession();

        // Re-fetch the task with populated dependencies to send back
        const updatedTask = await Task.findById(req.params.id).populate('dependsOn', 'title status');

        res.status(200).json({ success: true, data: updatedTask });

    } catch (error) {
        next(error);
    }
};

// @desc    Log time spent on a task
// @route   POST /api/tasks/:id/log-time
// @access  Private (Assignee only)
exports.logTimeToTask = async (req, res, next) => {
    try {
        const { timeSpent, date, notes } = req.body;
        if (!timeSpent || !date) {
            return res.status(400).json({ success: false, message: 'Time spent and date are required.' });
        }
        
        const task = await Task.findById(req.params.id);
        if (!task) { return res.status(404).json({ success: false, message: 'Task not found.' }); }

        // Security Check: Only assignees can log time.
        const isAssignee = task.assignees.some(id => id.toString() === req.user.id.toString());
        if (!isAssignee) {
            return res.status(403).json({ success: false, message: 'Only an assignee can log time on this task.' });
        }

        // Add the new time log to the array
        task.timeLogs.push({
            user: req.user.id,
            timeSpent: parseFloat(timeSpent),
            date,
            notes
        });

        // Recalculate the total time spent
        task.totalTimeSpent = task.timeLogs.reduce((acc, log) => acc + log.timeSpent, 0);

        await task.save();

        await createAuditLog({
            actor: req.user.id,
            action: 'TASK_TIME_LOGGED',
            target: { id: task._id, type: 'Task' },
            details: { timeSpent: `${timeSpent}h, total: ${task.totalTimeSpent}h` },
            ipAddress: req.ip
        });
        
        // Return the full, updated task object
        res.status(200).json({ success: true, data: task });

    } catch (error) {
        next(error);
    }
};

// @desc    Subscribe or unsubscribe the logged-in user to a task
// @route   POST /api/tasks/:id/subscribe
// @access  Private
exports.toggleTaskSubscription = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found.' });
        }

        const userId = req.user.id;
        const isSubscribed = task.subscribers.some(subscriberId => subscriberId.toString() === userId);
        
        let message = '';

        if (isSubscribed) {
            // If already subscribed, pull the user ID from the array to unsubscribe
            await Task.updateOne({ _id: task._id }, { $pull: { subscribers: userId } });
            message = 'You have unsubscribed from this task.';
        } else {
            // If not subscribed, add the user ID to the array to subscribe
            // We use $addToSet to prevent accidental duplicate entries
            await Task.updateOne({ _id: task._id }, { $addToSet: { subscribers: userId } });
            message = 'You are now subscribed to this task.';
        }
        
        
        const updatedTask = await Task.findById(req.params.id);

        res.status(200).json({ success: true, message, data: updatedTask });

    } catch (error) {
        next(error);
    }
};
