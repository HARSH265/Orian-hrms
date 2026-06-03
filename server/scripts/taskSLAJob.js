const Task = require('../model/task.model');
const { createNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

const SLA_THRESHOLDS = {
    High: { overdueHours: 24, label: '1 day' },
    Medium: { overdueHours: 72, label: '3 days' },
    Low: { overdueHours: 168, label: '7 days' },
};

const processTaskSLA = async () => {
    const now = new Date();
    const results = { notified: 0, errors: 0 };

    for (const [priority, threshold] of Object.entries(SLA_THRESHOLDS)) {
        const cutoff = new Date(now.getTime() - threshold.overdueHours * 60 * 60 * 1000);
        const overdueTasks = await Task.find({
            priority,
            dueDate: { $lt: cutoff },
            status: { $ne: 'Done' },
        }).populate('assignees', '_id name').populate('creator', '_id name');

        for (const task of overdueTasks) {
            try {
                const recipients = new Set();
                task.assignees.forEach(a => recipients.add(a._id.toString()));
                recipients.add(task.creator._id.toString());

                for (const recipientId of recipients) {
                    await createNotification({
                        recipient: recipientId,
                        sender: task.creator._id,
                        message: `SLA BREACH: "${task.title}" (${task.priority}) is overdue by over ${threshold.label}.`,
                        link: '/tasks',
                        type: 'Task',
                    }, {});
                }
                results.notified++;
            } catch (err) {
                logger.error(`SLA notification failed for task ${task._id}: ${err.message}`);
                results.errors++;
            }
        }
    }

    if (results.notified > 0 || results.errors > 0) {
        logger.info(`Task SLA job: notified ${results.notified}, errors ${results.errors}`);
    }
    return results;
};

const startTaskSLAJob = (intervalMs = 60 * 60 * 1000) => {
    logger.info('Task SLA job started (interval: 1h)');
    processTaskSLA().catch(err => logger.error('Task SLA job initial run failed:', err.message));
    setInterval(() => {
        processTaskSLA().catch(err => logger.error('Task SLA job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startTaskSLAJob, processTaskSLA };
