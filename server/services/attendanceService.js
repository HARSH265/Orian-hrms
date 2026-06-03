const Attendance = require('../model/attendance.model');
const User = require('../model/user');
const logger = require('../utils/logger');
const { getDescendantIds } = require('../utils/teamTree');

const getStartOfTodayUTC = () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return today;
};

const getDateNDaysAgoUTC = (days) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - days);
    return d;
};

const clockIn = async (employeeId) => {
    const today = getStartOfTodayUTC();

    const existing = await Attendance.findOne({ employee: employeeId, date: today });
    if (existing && existing.clockInTime) {
        return { record: existing, alreadyClockedIn: true };
    }

    const attendanceRecord = await Attendance.findOneAndUpdate(
        { employee: employeeId, date: today },
        { $setOnInsert: { employee: employeeId, date: today }, $set: { clockInTime: new Date() } },
        { new: true, upsert: true, runValidators: true }
    );
    return { record: attendanceRecord, alreadyClockedIn: false };
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
    record.totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    await record.save();

    return { record };
};

const getMyAttendance = async (userId, startDate, endDate) => {
    const query = { employee: userId };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.date.$lte = end;
        }
    } else {
        query.date = { $gte: getDateNDaysAgoUTC(30) };
    }

    const records = await Attendance.find(query).sort({ date: -1 });
    return records;
};

const getTeamAttendance = async (managerId, startDate, endDate) => {
    const teamMemberIds = await getDescendantIds(managerId);

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

const getAttendanceSummary = async (userId) => {
    const thirtyDaysAgo = getDateNDaysAgoUTC(30);
    const records = await Attendance.find({ employee: userId, date: { $gte: thirtyDaysAgo } });

    const totalDays = records.length;
    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const presentDays = records.filter(r => r.status === 'Present').length;
    const absentDays = records.filter(r => r.status === 'Absent').length;
    const onLeaveDays = records.filter(r => r.status === 'On Leave').length;

    return {
        totalDays,
        totalHours: Math.round(totalHours * 100) / 100,
        presentDays,
        absentDays,
        onLeaveDays,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
    };
};

const updateAttendanceRecord = async (recordId, updates, adminId) => {
    const allowed = ['clockInTime', 'clockOutTime', 'status', 'notes', 'totalHours'];
    const update = {};
    for (const key of allowed) {
        if (updates[key] !== undefined) update[key] = updates[key];
    }
    if (update.clockInTime && update.clockOutTime) {
        const durationMs = new Date(update.clockOutTime) - new Date(update.clockInTime);
        update.totalHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
    }
    const record = await Attendance.findByIdAndUpdate(recordId, { $set: update }, { new: true, runValidators: true });
    if (!record) throw new Error('Attendance record not found');
    return record;
};

module.exports = {
    clockIn,
    clockOut,
    getMyAttendance,
    getTeamAttendance,
    getAttendanceSummary,
    updateAttendanceRecord,
};
