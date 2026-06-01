// In: server/routes/taskRoutes.js

const express = require('express');
const {
    createTask, getMyTasks, getTeamTasks, updateTask, updateTaskStatus, deleteTask,
    getTasksCreatedByMe, getAllTasks, addComment, addAttachment, createSubTask, getTaskById,
    requestTaskReopen, updateTaskDependencies, resolveTaskReopen, logTimeToTask, toggleTaskSubscription 
} = require('../controllers/taskController');

// --- THE UPGRADE: Import checkPermissions and PERMISSIONS ---
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

// --- General & Self-Service Routes ---
// Anyone who can log in can perform these actions on their own tasks.
// The permission checks are inside the controllers for these.
router.route('/my-tasks').get(getMyTasks);
router.route('/created-by-me').get(getTasksCreatedByMe);
router.route('/:id/status').put(updateTaskStatus);
router.route('/:id/comments').post(addComment);
router.route('/:id/attachments').post(addAttachment);
router.route('/:id/subscribe').post(toggleTaskSubscription);
router.route('/:id/reopen-requests').post(requestTaskReopen);
router.route('/:id/log-time').post(logTimeToTask);
router.route('/:id/dependencies').put(updateTaskDependencies);
router.route('/:id/subtasks').post(createSubTask);
router.route('/:id').get(getTaskById); // The controller has internal checks
router.route('/reopen-requests/:requestId').put(resolveTaskReopen);

// --- Routes requiring specific permissions ---

// A user needs the generic CREATE_TASKS permission to create any task
router.route('/').post(checkPermissions(PERMISSIONS.CREATE_TASKS), createTask);

// A user needs specific VIEW_TEAM_TASKS permission to see their team's tasks
router.route('/team-tasks').get(checkPermissions(PERMISSIONS.VIEW_TEAM_TASKS), getTeamTasks);

// Admin-level routes for managing ANY task in the system
router.route('/all').get(checkPermissions(PERMISSIONS.EDIT_ALL_TASKS), getAllTasks);
router.route('/:id')
    .put(checkPermissions(PERMISSIONS.EDIT_ALL_TASKS), updateTask)
    .delete(checkPermissions(PERMISSIONS.DELETE_ALL_TASKS), deleteTask);

module.exports = router;