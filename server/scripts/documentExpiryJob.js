const Document = require('../model/Document');
const logger = require('../utils/logger');

const autoArchiveExpired = async () => {
    const now = new Date();
    const result = await Document.updateMany(
        { isActive: true, expiryDate: { $lte: now } },
        { isActive: false }
    );
    if (result.modifiedCount > 0) {
        logger.info(`Document expiry job: archived ${result.modifiedCount} expired document(s).`);
    }
    return result.modifiedCount;
};

const startDocumentExpiryJob = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info('Document expiry job started (interval: 24h)');
    autoArchiveExpired().catch(err => logger.error('Document expiry job initial run failed:', err.message));
    setInterval(() => {
        autoArchiveExpired().catch(err => logger.error('Document expiry job run failed:', err.message));
    }, intervalMs);
};

module.exports = { startDocumentExpiryJob };
