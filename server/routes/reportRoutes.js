const express = require('express');
const { getLeaveByDepartment, getExpensesByCategory } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All report routes are for managers and admins
router.use(protect, authorize('manager', 'hr', 'super-admin'));

router.get('/leave-by-department', getLeaveByDepartment);
router.get('/expenses-by-category', getExpensesByCategory);

module.exports = router;