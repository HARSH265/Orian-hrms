const express = require('express');
const {
    applyForLeave, getMyLeaveHistory, withdrawLeaveRequest,
    getTeamLeaves, reviewLeaveRequest, getAllLeaves,
    getLeaveSummary, exportLeaves,
} = require('../controllers/leaveController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), exportLeaves);
router.get('/summary', getLeaveSummary);
router.get('/summary/:employeeId', checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), getLeaveSummary);
router.get('/my-history', getMyLeaveHistory);
router.get('/team', getTeamLeaves);
router.get('/admin', checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES), getAllLeaves);

router.post('/', applyForLeave);

router.put('/:id/withdraw', withdrawLeaveRequest);
router.put('/:id/review', reviewLeaveRequest);

module.exports = router;
