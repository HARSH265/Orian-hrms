const express = require('express');
const {
    clockIn,
    clockOut,
    getMyAttendance,
    getTeamAttendance
} = require('../controllers/attendanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

// --- Employee Routes ---
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/my-records', getMyAttendance);

// --- Manager Route ---
router.get('/team-records', checkPermissions(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getTeamAttendance);

module.exports = router;