const Task = require('../model/task.model');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
// @desc    Create a new task (for a manager's direct report)
// @route   POST /api/tasks
// @access  Private (Manager+)
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, priority, assignee, dueDate } = req.body;
        const creator = req.user;
        const assigneeDoc = await User.findById(assignee);

        if (!assigneeDoc) {
            return res.status(404).json({ success: false, message: 'Assignee not found.' });
        }

        let isAuthorized = false;
        const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
        const creatorRoleIndex = roleHierarchy.indexOf(creator.role);
        const assigneeRoleIndex = roleHierarchy.indexOf(assigneeDoc.role);

        // Rule 1: Employee assigning up to their direct manager
        if (creator.role === 'employee' && creator.manager?.toString() === assigneeDoc._id.toString()) {
            isAuthorized = true;
        }

        // Rule 2: Manager assigning to a direct report OR any HR user
        if (creator.role === 'manager') {
            const isDirectReport = assigneeDoc.manager?.toString() === creator._id.toString();
            const isAssigneeHr = assigneeDoc.role === 'hr';
            if (isDirectReport || isAssigneeHr) {
                isAuthorized = true;
            }
        }

        // Rule 3: HR/Super-Admin assigning to anyone of an equal or lower role (but not themselves)
        if (creator.role === 'hr' || creator.role === 'super-admin') {
            if (assigneeRoleIndex <= creatorRoleIndex && creator._id.toString() !== assigneeDoc._id.toString()) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'You are not authorized to assign a task to this user.' });
        }
        
        const task = await Task.create({ title, description, priority, assignee, dueDate, creator: creator.id });

          await createNotification({
            recipient: assignee,
            sender: creator.id,
            message: `${creator.name} assigned you a new task: "${title}"`,
            link: '/tasks',
            type: 'Task',
        });

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks assigned to the logged-in user
// @route   GET /api/tasks/my-tasks
// @access  Private (Employee+)
exports.getMyTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ assignee: req.user.id })
            .populate('creator', 'name') // Show who created the task
            .sort({ dueDate: 1 }); // Sort by the nearest due date
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all tasks assigned to the manager's team
// @route   GET /api/tasks/team-tasks
// @access  Private (Manager+)
exports.getTeamTasks = async (req, res, next) => {
    try {
        const teamMembers = await User.find({ manager: req.user.id }).select('_id');
        const teamMemberIds = teamMembers.map(member => member._id);

        const tasks = await Task.find({ assignee: { $in: teamMemberIds } })
            .populate('assignee', 'name') // Show who the task is assigned to
            .sort({ dueDate: 1 });
        
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a task's details (by the creator)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
    try {
        let task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        // Security Check: Only the original creator can edit the main details
        if (task.creator.toString() !== req.user.id.toString() && req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this task' });
}
        task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a task's status (by the assignee)
// @route   PUT /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status: newStatus } = req.body; // <-- 1. RENAME the variable from the body
        let task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        
        if (task.assignee.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to update the status of this task' });
        }
        
        task.status = newStatus; // Use the renamed variable to update the task
        await task.save();

        // --- 2. THE FIX: Be explicit in the check ---
        // Now we are clearly checking the property of the `task` object.
        if (task.status === 'Done' && task.creator.toString() !== req.user.id.toString()) {
             await createNotification({
                recipient: task.creator,
                sender: req.user.id,
                message: `${req.user.name} completed the task: "${task.title}"`,
                link: '/tasks',
                type: 'Task',
            });
        }
        // --- END OF FIX ---

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a task (by the creator)
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(4404).json({ success: false, message: 'Task not found' });
        }
        // Security Check: Only the original creator can delete the task
       if (task.creator.toString() !== req.user.id.toString() && req.user.role !== 'super-admin') {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
}
        await task.remove();
        res.status(200).json({ success: true, message: 'Task deleted' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all tasks created by the logged-in user
 * @route   GET /api/tasks/created-by-me
 * @access  Private
 */
exports.getTasksCreatedByMe = async (req, res, next) => {
    try {
        const tasks = await Task.find({ creator: req.user.id })
            .populate('assignee', 'name') // Show who the task was assigned to
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};

// @desc    Get ALL tasks in the system (for Admin view)
// @route   GET /api/tasks/all
// @access  Private (HR, Super-Admin)
exports.getAllTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({})
            .populate('assignee', 'name')
            .populate('creator', 'name')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        next(error);
    }
};