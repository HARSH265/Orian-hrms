const express = require('express');
const { getBudget, setBudget, getBudgetSummary } = require('../controllers/expenseBudgetController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();
router.use(protect);

router.route('/').post(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), setBudget);
router.route('/:departmentId').get(getBudget);
router.route('/:departmentId/summary').get(getBudgetSummary);

module.exports = router;
