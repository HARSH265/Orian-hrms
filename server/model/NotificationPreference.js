const mongoose = require('mongoose');

const NotificationPreferenceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    types: {
        Leave: { type: Boolean, default: true },
        Task: { type: Boolean, default: true },
        Expense: { type: Boolean, default: true },
        Announcement: { type: Boolean, default: true },
        General: { type: Boolean, default: true },
        Kudos: { type: Boolean, default: true },
        Document: { type: Boolean, default: true },
        Asset: { type: Boolean, default: true },
        System: { type: Boolean, default: true },
    },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreference', NotificationPreferenceSchema);
