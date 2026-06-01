const Attendance = require('../model/attendance.model');
const User = require('../model/user');
const logger = require('../utils/logger');

const getStartOfTodayUTC = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
};

const clockIn = async (employeeId) => {
    const today = getStartOfTodayUTC();

    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing && existing.clockInTime) {
        return existing;
    }

    const attendanceRecord = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: today },
        { $setOnInsert: { employee: employeeId, date: today }, $set: { clockInTime: new Date() } },
        { new: true, upsert: true, runValidators: true }
    );
    return attendanceRecord;
};

const clockOut = async (employeeId) => {
    const today = getStartOfTodayUTC();
    const now = new Date();

    const record = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: today, clockInTime: { $exists: true }, clockOutTime: null },
        { $set: { clockOutTime: now } },
        { new: true }
    );

    if (!record) {
        const existing = await Attendance.findOne({ employee: employeeId, date: today });
        if (!existing || !existing.clockInTime) {
            return { error: 'You have not clocked in today.' };
        }
        if (existing.clockOutTime) {
            return { error: 'You have already clocked out today.' };
        }
        return { error: 'Clock-out failed. Please try again.' };
    }

    const durationMs = now - record.clockInTime;
    record.totalHours = durationMs / (1000 * 60 * 60);
    await record.save();

    return { record };
};

const getMyAttendance = async (userId, startDate, endDate) => {
    const query = { employee: userId };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.date = { $gte: thirtyDaysAgo };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    return records;
};

const getTeamAttendance = async (managerId, startDate, endDate) => {
    const teamMembers = await User.find({ manager: managerId }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);

    const query = { employee: { $in: teamMemberIds } };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    } else {
        query.date = getStartOfTodayUTC();
    }

    const records = await Attendance.find(query)
        .populate('employee', 'name')
        .sort({ date: -1 });
    return records;
};

module.exports = {
    clockIn,
    clockOut,
    getMyAttendance,
    getTeamAttendance,
};
