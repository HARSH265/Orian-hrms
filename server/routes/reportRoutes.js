const express = require('express');
const { getLeaveByDepartment, getExpensesByCategory } = require('../controllers/reportController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All report routes are for managers and admins
router.use(protect, checkPermissions(PERMISSIONS.VIEW_REPORTS));

router.get('/leave-by-department', getLeaveByDepartment);
router.get('/expenses-by-category', getExpensesByCategory);

module.exports = router;