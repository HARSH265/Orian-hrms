const logger = require('../utils/logger');
const reviewScheduleService = require('../services/reviewScheduleService');

const processSchedules = async () => {
    const count = await reviewScheduleService.processSchedules();
    if (count > 0) logger.info(`Review schedule job: initiated ${count} review(s).`);
};

const startReviewScheduleJob = (intervalMs = 60 * 60 * 1000) => {
    logger.info('Review schedule job started (interval: 1h)');
    processSchedules().catch(err => logger.error('Review schedule job initial run failed:', err.message));
    setInterval(() => {
        processSchedules().catch(err => logger.error('Review schedule job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startReviewScheduleJob };
