const { clockIn, clockOut, getMyAttendance, getTeamAttendance } = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Employee clocks in for the day
// @route   POST /api/attendance/clock-in
exports.clockIn = asyncHandler(async (req, res, next) => {
    try {
        const attendanceRecord = await clockIn(req.user.id);
        res.status(200).json({ success: true, message: 'Clocked in successfully.', data: attendanceRecord });
    } catch (error) {
        next(error);
    }
});

// @desc    Employee clocks out for the day
// @route   POST /api/attendance/clock-out
exports.clockOut = asyncHandler(async (req, res, next) => {
    try {
        const result = await clockOut(req.user.id);

        if (result.error) {
            return res.status(400).json({ success: false, message: result.error });
        }

        res.status(200).json({ success: true, message: 'Clocked out successfully.', data: result.record });
    } catch (error) {
        next(error);
    }
});

// @desc    Get the logged-in user's attendance records for a given month
// @route   GET /api/attendance/my-records
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
    try {
        const records = await getMyAttendance(req.user.id);
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
});

// @desc    Get team attendance records (for Manager)
// @route   GET /api/attendance/team-records
exports.getTeamAttendance = asyncHandler(async (req, res, next) => {
    try {
        const records = await getTeamAttendance(req.user.id);
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
});
