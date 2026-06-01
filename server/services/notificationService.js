// In: server/services/notificationService.js

const Notification = require('../model/notification.model');
const Task = require('../model/task.model');
const logger = require('../utils/logger');

/**
 * A reusable, enhanced function to create notifications and emit real-time events.
 * It can handle a single recipient OR find all recipients related to a task.
 * @param {object} details - The notification details.
 * @param {string} [details.recipient] - A specific user ID to notify. (For simple, non-task notifications)
 * @param {string} [details.taskId] - The ID of a task to notify all its followers (creator, assignees, subscribers).
 * @param {string} details.sender - The ID of the user who triggered the event.
 * @param {string} details.message - The notification message.
 * @param {object} req - The Express request object, used to access the global `io` instance.
 */
const createNotification = async (details, req) => {
    try {
        const { recipient, sender, message, link = '#', type = 'General', taskId } = details;

        if (!message) {
            throw new Error('Message is required to create a notification.');
        }

        let recipients = [];
        
        // Handle single, direct recipient calls (for backward compatibility with other modules)
        if (recipient) {
            recipients.push(recipient);
        }

        // Handle task-based notifications to include creator, assignees, and subscribers
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

        // 1. Remove duplicates from the recipients array.
        const uniqueRecipientIds = [...new Set(recipients.map(id => id.toString()))];
        
        // 2. Filter out the person who performed the action (sender).
        const finalRecipients = uniqueRecipientIds.filter(id => id !== sender?.toString());

        if (finalRecipients.length === 0) {
            logger.info("No recipients to notify after filtering out the sender.");
            return;
        }

        // Create notification documents in bulk for efficiency
        const notificationDocs = finalRecipients.map(recipientId => ({
            recipient: recipientId,
            sender,
            message,
            type,
            link
        }));
        
        const createdNotifications = await Notification.insertMany(notificationDocs);
        
        // Emit real-time events to each recipient's personal room
        if (req?.app?.get('io')) {
            const io = req.app.get('io');
            createdNotifications.forEach(notification => {
                io.to(notification.recipient.toString()).emit('newNotification', notification);
                logger.info(`---> Real-time notification sent to user room: ${notification.recipient}`);
            });
        }

    } catch (error) {
        logger.error('Error in createNotification service:', error);
    }
};

module.exports = { createNotification };



// // In: server/services/notificationService.js

// const Notification = require('../model/notification.model');
// // --- REAL-TIME NOTIFICATION UPGRADE: Import the socket map from server.js ---
// const { userSocketMap } = require('../server');
// // --- END UPGRADE ---

// /**
//  * A reusable function to create a new notification and emit a real-time event.
//  * @param {object} details - The notification details.
//  * @param {object} req - The Express request object, used to access the global `io` instance.
//  */
// const createNotification = async (details, req) => {
//     const { recipient, message, link = '#', type = 'General', sender = null } = details;
//     try {
//         if (!recipient || !message) {
//             throw new Error('Recipient and message are required to create a notification.');
//         }

//         // 1. Create the notification document in the database
//         const newNotification = await Notification.create({ recipient, sender, message, type, link });
//         console.log(`Notification created in DB for user ${recipient}: "${message}"`);

//         // --- REAL-TIME NOTIFICATION UPGRADE: Emit a socket event ---
//         if (req && req.app) {
//             const io = req.app.get('io');
//             if (io && userSocketMap) {
//                 const recipientSocketId = userSocketMap[recipient.toString()];
//                 if (recipientSocketId) {
//                     // Emit the 'newNotification' event directly to the recipient's socket
//                     io.to(recipientSocketId).emit('newNotification', newNotification);
//                     console.log(`---> Real-time notification sent to user ${recipient}`);
//                 } else {
//                     console.log(`User ${recipient} is not currently connected. No real-time event sent.`);
//                 }
//             }
//         }
//         // --- END UPGRADE ---

//     } catch (error) {
//         console.error('Error in createNotification service:', error);
//     }
// };

// module.exports = { createNotification };