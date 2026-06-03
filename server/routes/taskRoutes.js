const express = require('express');
const {
    createTask, getMyTasks, getTeamTasks, updateTask, updateTaskStatus, deleteTask,
    getTasksCreatedByMe, getAllTasks, addComment, addAttachment, createSubTask, getTaskById,
    requestTaskReopen, updateTaskDependencies, resolveTaskReopen, logTimeToTask, toggleTaskSubscription,
    getMyTaskSummary, getDashboard, getKanbanBoard, setRecurrence, exportCSV, getActivityFeed,
    bulkUpdateStatus, bulkAssign, bulkDelete,
} = require('../controllers/taskController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

// ─── Static routes (must precede /:id) ──────────────────────
router.get('/my-tasks', getMyTasks);
router.get('/my-summary', getMyTaskSummary);
router.get('/dashboard', getDashboard);
router.get('/board', getKanbanBoard);
router.get('/export', exportCSV);
router.get('/created-by-me', getTasksCreatedByMe);
router.get('/all', checkPermissions(PERMISSIONS.EDIT_ALL_TASKS), getAllTasks);
router.get('/team-tasks', checkPermissions(PERMISSIONS.VIEW_TEAM_TASKS), getTeamTasks);

router.post('/bulk/status', writeLimiter, bulkUpdateStatus);
router.post('/bulk/assign', writeLimiter, bulkAssign);
router.post('/bulk/delete', writeLimiter, bulkDelete);

router.post('/', writeLimiter, checkPermissions(PERMISSIONS.CREATE_TASKS), createTask);

// ─── Reopen resolution (static param name) ──────────────────
router.put('/reopen-requests/:requestId', writeLimiter, resolveTaskReopen);

// ─── Param routes ───────────────────────────────────────────
router.get('/:id', getTaskById);
router.put('/:id', writeLimiter, updateTask);
router.delete('/:id', writeLimiter, checkPermissions(PERMISSIONS.DELETE_ALL_TASKS), deleteTask);

router.put('/:id/status', writeLimiter, updateTaskStatus);
router.post('/:id/comments', writeLimiter, addComment);
router.post('/:id/attachments', writeLimiter, addAttachment);
router.post('/:id/subscribe', writeLimiter, toggleTaskSubscription);
router.post('/:id/reopen-requests', writeLimiter, requestTaskReopen);
router.post('/:id/log-time', writeLimiter, logTimeToTask);
router.put('/:id/dependencies', writeLimiter, updateTaskDependencies);
router.put('/:id/recurrence', writeLimiter, setRecurrence);
router.post('/:id/subtasks', writeLimiter, createSubTask);
router.get('/:id/activity', getActivityFeed);

module.exports = router;
