const express = require('express');
const { getMyBalances, getAdminBalances, assignPolicyToEmployee, bulkAssignPolicy } = require('../controllers/leaveBalanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my-balances', getMyBalances);
router.get('/admin', checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), getAdminBalances);
router.post('/', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), assignPolicyToEmployee);
router.post('/bulk', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), bulkAssignPolicy);

module.exports = router;
