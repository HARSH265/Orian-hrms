const Notification = require('../model/notification.model');
const Task = require('../model/task.model');
const logger = require('../utils/logger');
const { isTypeEnabled } = require('./notificationPreferenceService');

let ioInstance = null;

const setIO = (io) => {
    ioInstance = io;
};

const getIO = (req) => {
    if (ioInstance) return ioInstance;
    if (req?.app?.get) return req.app.get('io');
    return null;
};

const createNotification = async (details, req) => {
    try {
        const { recipient, sender, message, link = '#', type = 'General', taskId, priority = 'normal' } = details;

        if (!message) {
            throw new Error('Message is required to create a notification.');
        }

        let recipients = [];

        if (recipient) {
            recipients.push(recipient);
        }

        if (taskId) {
            const task = await Task.findById(taskId).select('creator assignees subscribers').lean();
            if (task) {
                recipients.push(task.creator);
                recipients.push(...task.assignees);
                recipients.push(...task.subscribers);
            }
        }

        if (recipients.length === 0) {
            logger.info("No recipients found for this notification.");
            return;
        }

        const uniqueRecipientIds = [...new Set(recipients.map(id => id.toString()))];
        let finalRecipients = uniqueRecipientIds.filter(id => id !== sender?.toString());

        const preferenceChecks = finalRecipients.map(async (id) => {
            const enabled = await isTypeEnabled(id, type);
            return enabled ? id : null;
        });
        const preferenceResults = await Promise.all(preferenceChecks);
        finalRecipients = preferenceResults.filter(Boolean);

        if (finalRecipients.length === 0) {
            logger.info("No recipients to notify after filtering out preferences.");
            return;
        }

        const notificationDocs = finalRecipients.map(recipientId => ({
            recipient: recipientId,
            sender: sender || null,
            message,
            type,
            priority,
            link,
        }));

        const createdNotifications = await Notification.insertMany(notificationDocs);

        const io = getIO(req);
        if (io) {
            createdNotifications.forEach(notification => {
                io.to(notification.recipient.toString()).emit('newNotification', notification);
            });
        }
    } catch (error) {
        logger.error('Error in createNotification service:', error);
    }
};

module.exports = { createNotification, setIO };
