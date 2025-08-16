const Notification = require('../model/notification.model');

/**
 * A reusable function to create a new notification.
 * @param {string} recipient - The ID of the user to receive the notification.
 * @param {string} message - The notification message.
 * @param {string} [link='#'] - The URL to navigate to on click.
 * @param {string} [type='General'] - The type of notification.
 * @param {string} [sender=null] - The ID of the user who triggered the event.
 */
const createNotification = async ({ recipient, message, link = '#', type = 'General', sender = null }) => {
    try {
        if (!recipient || !message) {
            throw new Error('Recipient and message are required to create a notification.');
        }
        await Notification.create({ recipient, sender, message, type, link });
        console.log(`Notification created for user ${recipient}: "${message}"`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

module.exports = { createNotification };