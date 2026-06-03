const express = require('express');
const {
    submitExpense, getMyExpenses, getTeamExpenses, updateExpenseStatus,
    getAllExpenses, uploadReceipt, reimburseExpense, deleteExpense, exportCSV, getSummary,
} = require('../controllers/expenseController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.use(protect);

// ─── Employee routes ────────────────────────────────────────
router.get('/my-expenses', getMyExpenses);
router.get('/my-summary', getSummary);
router.get('/my-summary/:employeeId', checkPermissions(PERMISSIONS.MANAGE_EXPENSES), getSummary);
router.get('/export', checkPermissions(PERMISSIONS.VIEW_EXPENSES), exportCSV);

router.post('/', writeLimiter, submitExpense);
router.post('/:id/receipt', writeLimiter, upload.single('receipt'), uploadReceipt);

// ─── Admin routes ───────────────────────────────────────────
router.get('/all', checkPermissions(PERMISSIONS.MANAGE_EXPENSES), getAllExpenses);

// ─── Manager & Admin routes ─────────────────────────────────
router.get('/team-expenses', checkPermissions(PERMISSIONS.VIEW_TEAM_EXPENSES), getTeamExpenses);
router.put('/:id/status', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_EXPENSES), updateExpenseStatus);
router.post('/:id/reimburse', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_EXPENSES), reimburseExpense);
router.delete('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_EXPENSES), deleteExpense);

module.exports = router;
