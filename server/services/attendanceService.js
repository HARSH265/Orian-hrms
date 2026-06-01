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
    const attendanceRecord = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: today },
        { $setOnInsert: { employee: employeeId, date: today }, $set: { clockInTime: new Date() } },
        { new: true, upsert: true, runValidators: true }
    );
    return attendanceRecord;
};

const clockOut = async (employeeId) => {
    const today = getStartOfTodayUTC();
    const record = await Attendance.findOne({ employee: employeeId, date: today });

    if (!record || !record.clockInTime) {
        return { error: 'You have not clocked in today.' };
    }
    if (record.clockOutTime) {
        return { error: 'You have already clocked out today.' };
    }

    record.clockOutTime = new Date();
    const durationMs = record.clockOutTime - record.clockInTime;
    record.totalHours = durationMs / (1000 * 60 * 60);
    await record.save();

    return { record };
};

const getMyAttendance = async (userId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await Attendance.find({
        employee: userId,
        date: { $gte: thirtyDaysAgo }
    }).sort({ date: -1 });
    return records;
};

const getTeamAttendance = async (managerId) => {
    const teamMembers = await User.find({ manager: managerId }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);

    const today = getStartOfTodayUTC();

    const records = await Attendance.find({
        employee: { $in: teamMemberIds },
        date: today
    }).populate('employee', 'name');
    return records;
};

module.exports = {
    clockIn,
    clockOut,
    getMyAttendance,
    getTeamAttendance,
};
