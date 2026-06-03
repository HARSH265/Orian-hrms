const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    message: {
        type: String,
        required: [true, 'Please add a notification message'],
    },
    type: {
        type: String,
        enum: ['Leave', 'Task', 'Expense', 'Announcement', 'General', 'Kudos', 'Document', 'Asset', 'System'],
        default: 'General',
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal',
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    link: {
        type: String,
        default: '#',
    }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);