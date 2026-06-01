const Attendance = require('../model/attendance.model');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// Helper to get the start of the current day in UTC
const getStartOfTodayUTC = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
    });

// @desc    Employee clocks in for the day
// @route   POST /api/attendance/clock-in
exports.clockIn = asyncHandler(async (req, res, next) => {
    try {
        const today = getStartOfTodayUTC();
        const employeeId = req.user.id;

        // Use findOneAndUpdate with 'upsert' to create a new record if one doesn't exist for today.
        // This is an atomic operation and prevents race conditions.
        const attendanceRecord = await Attendance.findOneAndUpdate(
            { employee: employeeId, date: today },
            { $setOnInsert: { employee: employeeId, date: today }, $set: { clockInTime: new Date() } },
            { new: true, upsert: true, runValidators: true }
        );

        res.status(200).json({ success: true, message: 'Clocked in successfully.', data: attendanceRecord });
    } catch (error) {
        next(error);
    }
    });

// @desc    Employee clocks out for the day
// @route   POST /api/attendance/clock-out
exports.clockOut = asyncHandler(async (req, res, next) => {
    try {
        const today = getStartOfTodayUTC();
        const employeeId = req.user.id;

        const record = await Attendance.findOne({ employee: employeeId, date: today });

        if (!record || !record.clockInTime) {
            return res.status(400).json({ success: false, message: 'You have not clocked in today.' });
        }
        if (record.clockOutTime) {
            return res.status(400).json({ success: false, message: 'You have already clocked out today.' });
        }

        record.clockOutTime = new Date();
        // Calculate total hours
        const durationMs = record.clockOutTime - record.clockInTime;
        record.totalHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
        
        await record.save();

        res.status(200).json({ success: true, message: 'Clocked out successfully.', data: record });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get the logged-in user's attendance records for a given month
// @route   GET /api/attendance/my-records
exports.getMyAttendance = asyncHandler(async (req, res, next) => {
    try {
        // In a real app, you'd pass month/year as query params. For now, we'll get the last 30 days.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const records = await Attendance.find({ 
            employee: req.user.id,
            date: { $gte: thirtyDaysAgo }
        }).sort({ date: -1 });
        
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get team attendance records (for Manager)
// @route   GET /api/attendance/team-records
exports.getTeamAttendance = asyncHandler(async (req, res, next) => {
    try {
        const teamMembers = await User.find({ manager: req.user.id }).select('_id');
        const teamMemberIds = teamMembers.map(member => member._id);

        const today = getStartOfTodayUTC();

        // Get today's records for the team
        const records = await Attendance.find({ 
            employee: { $in: teamMemberIds },
            date: today 
        }).populate('employee', 'name');
        
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};