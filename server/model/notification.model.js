const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { // The user who will receive the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Add an index for faster querying of a user's notifications
    },
    sender: { // The user who triggered the notification (optional)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // System notifications might not have a sender
    },
    message: {
        type: String,
        required: [true, 'Please add a notification message'],
    },
    type: { // To categorize notifications, useful for icons or special handling
        type: String,
        enum: ['Leave', 'Task', 'Expense', 'Announcement', 'General', 'Kudos'],
        default: 'General',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: { // A URL to navigate to when the notification is clicked
        type: String,
        default: '#',
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);