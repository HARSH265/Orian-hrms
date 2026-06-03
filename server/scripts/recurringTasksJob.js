const Task = require('../model/task.model');
const logger = require('../utils/logger');

const computeNextDueDate = (interval, fromDate) => {
    const next = new Date(fromDate);
    switch (interval) {
        case 'daily': next.setDate(next.getDate() + 1); break;
        case 'weekly': next.setDate(next.getDate() + 7); break;
        case 'monthly': next.setMonth(next.getMonth() + 1); break;
        case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
        default: next.setDate(next.getDate() + 7);
    }
    return next;
};

const processRecurringTasks = async () => {
    const now = new Date();
    const dueTasks = await Task.find({
        isRecurring: true,
        nextDueDate: { $lte: now },
        status: 'Done',
    }).populate('assignees', '_id');

    let created = 0;
    for (const parent of dueTasks) {
        try {
            const newTask = await Task.create({
                title: parent.title,
                description: parent.description,
                priority: parent.priority,
                assignees: parent.assignees.map(a => a._id),
                creator: parent.creator,
                dueDate: parent.nextDueDate,
                timeEstimate: parent.timeEstimate,
                isRecurring: true,
                recurrenceInterval: parent.recurrenceInterval,
                nextDueDate: computeNextDueDate(parent.recurrenceInterval, parent.nextDueDate),
                originalTask: parent.originalTask || parent._id,
            });

            parent.nextDueDate = computeNextDueDate(parent.recurrenceInterval, parent.nextDueDate);
            await parent.save();
            created++;
        } catch (err) {
            logger.error(`Recurring task creation failed for task ${parent._id}: ${err.message}`);
        }
    }

    if (created > 0) logger.info(`Recurring tasks job: created ${created} new task(s)`);
    return created;
};

const startRecurringTaskJob = (intervalMs = 6 * 60 * 60 * 1000) => {
    logger.info('Recurring tasks job started (interval: 6h)');
    processRecurringTasks().catch(err => logger.error('Recurring tasks job initial run failed:', err.message));
    setInterval(() => {
        processRecurringTasks().catch(err => logger.error('Recurring tasks job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startRecurringTaskJob, processRecurringTasks };
