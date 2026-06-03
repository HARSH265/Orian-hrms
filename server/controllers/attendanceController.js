const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

exports.clockIn = asyncHandler(async (req, res) => {
    const result = await attendanceService.clockIn(req.user.id);
    const message = result.alreadyClockedIn
        ? 'Already clocked in today.'
        : 'Clocked in successfully.';
    res.status(200).json({ success: true, message, data: result.record, alreadyClockedIn: result.alreadyClockedIn });
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

exports.getMySummary = asyncHandler(async (req, res) => {
    const summary = await attendanceService.getAttendanceSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
});

exports.updateAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const record = await attendanceService.updateAttendanceRecord(id, req.body, req.user.id);
    res.status(200).json({ success: true, message: 'Attendance record updated.', data: record });
});
