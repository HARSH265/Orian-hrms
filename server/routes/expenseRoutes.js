const express = require('express');
const {
    submitExpense,
    getMyExpenses,
    getTeamExpenses,
    updateExpenseStatus,
    getAllExpenses
} = require('../controllers/expenseController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);

// --- Employee Routes ---
router.route('/').post(submitExpense);
router.route('/my-expenses').get(getMyExpenses);

// --- the new admin route ---
router.route('/all').get(authorize('hr', 'super-admin'), getAllExpenses);

// --- Manager & Admin Routes ---
router.route('/team-expenses').get(authorize('manager', 'hr', 'super-admin'), getTeamExpenses);
router.route('/:id/status').put(authorize('manager', 'hr', 'super-admin'), updateExpenseStatus);

module.exports = router;