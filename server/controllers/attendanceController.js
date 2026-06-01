const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

exports.clockIn = asyncHandler(async (req, res) => {
    const record = await attendanceService.clockIn(req.user.id);
    res.status(200).json({ success: true, message: 'Clocked in successfully.', data: record });
});

exports.clockOut = asyncHandler(async (req, res) => {
    const result = await attendanceService.clockOut(req.user.id);
    if (result.error) {
        return res.status(400).json({ success: false, message: result.error });
    }
    res.status(200).json({ success: true, message: 'Clocked out successfully.', data: result.record });
});

exports.getMyAttendance = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const records = await attendanceService.getMyAttendance(req.user.id, startDate, endDate);
    res.status(200).json({ success: true, data: records });
});

exports.getTeamAttendance = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const records = await attendanceService.getTeamAttendance(req.user.id, startDate, endDate);
    res.status(200).json({ success: true, data: records });
});
