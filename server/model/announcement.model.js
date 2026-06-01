const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
    },
    content: {
        type: String,
        required: [true, 'Please add content'],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // We can add more advanced features later, like 'targetRole' or 'isPublished'
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Published',
    }
}, { timestamps: true });

AnnouncementSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);