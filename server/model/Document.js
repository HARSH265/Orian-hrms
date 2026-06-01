const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required.'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    fileUrl: {
        type: String,
        required: [true, 'A file URL is required.'],
    },
    category: {
        type: String,
        default: 'General',
        trim: true,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Track which users are required to acknowledge this document
    acknowledgementRequired: {
        type: Boolean,
        default: false,
    },
    // Track which users *have* acknowledged the document
    acknowledgedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        acknowledgedAt: {
            type: Date,
            default: Date.now,
        },
    }],
    isActive: {
        type: Boolean,
        default: true, // For soft deletes
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);