const logger = require('../utils/logger');
const Review = require('../model/review.model');
const { createNotification } = require('../services/notificationService');

const sendReminders = async () => {
    const pendingSelf = await Review.find({ status: 'Pending Self-Assessment' }).populate('employee', 'name _id');
    for (const review of pendingSelf) {
        await createNotification({
            recipient: review.employee._id,
            message: `Reminder: Your self-assessment for '${review.cycleName}' is due.`,
            link: '/performance/my-reviews', type: 'General',
        });
    }

    const pendingManager = await Review.find({ status: 'Pending Manager Review' }).populate('manager', 'name _id');
    for (const review of pendingManager) {
        await createNotification({
            recipient: review.manager._id,
            message: `Reminder: Manager review for '${review.cycleName}' is pending.`,
            link: '/performance/team-reviews', type: 'General',
        });
    }

    logger.info(`Review reminder job: ${pendingSelf.length} self, ${pendingManager.length} manager reminders sent.`);
};

const startReviewReminderJob = (intervalMs = 8 * 60 * 60 * 1000) => {
    logger.info('Review reminder job started (interval: 8h — ~weekday 8AM if server started at midnight)');
    sendReminders().catch(err => logger.error('Review reminder job initial run failed:', err.message));
    setInterval(() => {
        sendReminders().catch(err => logger.error('Review reminder job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startReviewReminderJob };
