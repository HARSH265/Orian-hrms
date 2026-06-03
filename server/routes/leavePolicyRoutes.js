const express = require('express');
const {
    getAllLeavePolicies, createLeavePolicy, updateLeavePolicy, archiveLeavePolicy, unarchiveLeavePolicy,
} = require('../controllers/leavePolicyController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.get('/', protect, getAllLeavePolicies);

router.use(protect, checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES));
router.post('/', writeLimiter, createLeavePolicy);
router.put('/:id', writeLimiter, updateLeavePolicy);
router.delete('/:id', writeLimiter, archiveLeavePolicy);
router.patch('/:id/unarchive', writeLimiter, unarchiveLeavePolicy);

module.exports = router;
