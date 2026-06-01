const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    clockIn,
    clockOut,
    getMyAttendance,
    getTeamAttendance
} = require('../controllers/attendanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

const clockLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(protect);

// --- Employee Routes ---
router.post('/clock-in', clockLimiter, clockIn);
router.post('/clock-out', clockLimiter, clockOut);
router.get('/my-records', getMyAttendance);

// --- Manager Route ---
router.get('/team-records', checkPermissions(PERMISSIONS.VIEW_TEAM_ATTENDANCE), getTeamAttendance);

module.exports = router;