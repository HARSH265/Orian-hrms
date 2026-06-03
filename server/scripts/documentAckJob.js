const logger = require('../utils/logger');
const docService = require('../services/documentService');

const sendAckReminders = async () => {
    const sent = await docService.sendAckReminders({});
    if (sent > 0) logger.info(`Document ack job: sent ${sent} reminder(s).`);
};

const startDocumentAckJob = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info('Document ack job started (interval: 24h)');
    sendAckReminders().catch(err => logger.error('Document ack job initial run failed:', err.message));
    setInterval(() => {
        sendAckReminders().catch(err => logger.error('Document ack job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startDocumentAckJob };
