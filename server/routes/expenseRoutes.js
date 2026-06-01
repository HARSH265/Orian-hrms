const express = require('express');
const {
    submitExpense,
    getMyExpenses,
    getTeamExpenses,
    updateExpenseStatus,
    getAllExpenses
} = require('../controllers/expenseController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require login
router.use(protect);

// --- Employee Routes ---
router.route('/').post(submitExpense);
router.route('/my-expenses').get(getMyExpenses);

// --- the new admin route ---
router.route('/all').get(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), getAllExpenses);

// --- Manager & Admin Routes ---
router.route('/team-expenses').get(checkPermissions(PERMISSIONS.VIEW_TEAM_EXPENSES), getTeamExpenses);
router.route('/:id/status').put(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), updateExpenseStatus);

module.exports = router;