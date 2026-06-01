const AuditLog = require('../model/AuditLog');
const logger = require('../utils/logger');

/**
 * A reusable function to create a new audit log entry.
 * @param {object} logData - The data for the log entry.
 * @param {string} logData.actor - The ID of the user performing the action.
 *- @param {string} logData.action - A string describing the action (e.g., 'USER_LOGIN').
 * @param {string} [logData.ipAddress] - The IP address of the user.
 * @param {object} [logData.target] - The entity being affected.
 * @param {string} [logData.target.id] - The ID of the affected entity.
 * @param {string} [logData.target.type] - The model name of the entity (e.g., 'User').
 * @param {object} [logData.details] - Any extra JSON data to store.
 */
const createAuditLog = async (logData) => {
    try {
        if (!logData.actor || !logData.action) {
            throw new Error('Actor and Action are required to create an audit log.');
        }
        await AuditLog.create(logData);
    } catch (error) {
        // In a real production environment, you might log this to a separate
        // logging service instead of the console (e.g., Sentry, LogDNA).
        logger.error('Error creating audit log:', error);
    }
};

module.exports = { createAuditLog };