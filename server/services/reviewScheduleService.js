const ReviewSchedule = require('../model/reviewSchedule.model');
const Review = require('../model/review.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const err = (msg, s) => { const e = new Error(msg); e.status = s; return e; };

const createSchedule = async (data, userId) => {
    const schedule = await ReviewSchedule.create({ ...data, createdBy: userId, nextRun: data.startDate });
    return schedule;
};

const getAllSchedules = async () => {
    return ReviewSchedule.find().populate('createdBy', 'name').sort({ startDate: -1 });
};

const updateSchedule = async (id, data) => {
    const s = await ReviewSchedule.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!s) throw err('Schedule not found.', 404);
    return s;
};

const deleteSchedule = async (id) => {
    const s = await ReviewSchedule.findByIdAndDelete(id);
    if (!s) throw err('Schedule not found.', 404);
    return { message: 'Schedule deleted.' };
};

const processSchedules = async () => {
    const now = new Date();
    const due = await ReviewSchedule.find({ isActive: true, nextRun: { $lte: now } });
    let initiated = 0;
    for (const schedule of due) {
        try {
            const filter = schedule.department ? { manager: { $ne: null }, department: schedule.department, isActive: true }
                : { manager: { $ne: null }, isActive: true };
            const employees = await User.find(filter).select('_id manager');
            if (employees.length === 0) continue;

            const reviewsData = employees
                .filter(emp => emp.manager)
                .map(emp => ({ employee: emp._id, manager: emp.manager, cycleName: schedule.cycleName, template: schedule.template }));

            await Review.insertMany(reviewsData);
            initiated += reviewsData.length;

            const nextDate = new Date(schedule.nextRun);
            if (schedule.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
            else nextDate.setFullYear(nextDate.getFullYear() + 1);

            schedule.lastRun = now;
            schedule.nextRun = nextDate;
            await schedule.save();
        } catch (err) {
            logger.error(`Review schedule ${schedule._id} processing failed: ${err.message}`);
        }
    }
    if (initiated > 0) logger.info(`Review schedule job: initiated ${initiated} review(s)`);
    return initiated;
};

module.exports = { createSchedule, getAllSchedules, updateSchedule, deleteSchedule, processSchedules };
