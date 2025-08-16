const express = require('express');
const {
    createTask,
    getMyTasks,
    getTeamTasks,
    updateTask,
    updateTaskStatus,
    deleteTask,
    getTasksCreatedByMe,
    getAllTasks,
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All task routes require a user to be logged in
router.use(protect);

// --- Task Creation ---
router.route('/').post(createTask); // Open to all logged-in users, logic is in controller

// --- Data Fetching ---
router.route('/my-tasks').get(getMyTasks);
router.route('/created-by-me').get(getTasksCreatedByMe);
router.route('/team-tasks').get(authorize('manager', 'hr', 'super-admin'), getTeamTasks);
router.route('/all').get(authorize('hr', 'super-admin'), getAllTasks); // New global route

// --- Task Modification ---
router.route('/:id').put(updateTask).delete(deleteTask);
router.route('/:id/status').put(updateTaskStatus);

module.exports = router;