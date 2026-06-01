const express = require('express');
const { getMyBalances, assignPolicyToEmployee } = require('../controllers/leaveBalanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

// Employee can get their own balances
router.get('/my-balances', getMyBalances);

// Admin can assign policies
router.post('/', checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), assignPolicyToEmployee);

module.exports = router;