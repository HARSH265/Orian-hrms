const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Document title is required.'], trim: true },
    description: { type: String, trim: true },
    fileUrl: { type: String, required: [true, 'A file URL is required.'] },
    publicId: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    category: { type: String, default: 'General', trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    folder: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentFolder', default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    currentVersion: { type: Number, default: 1 },
    acknowledgementRequired: { type: Boolean, default: false },
    acknowledgedBy: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        acknowledgedAt: { type: Date, default: Date.now },
    }],
    expiryDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

documentSchema.virtual('isExpired').get(function () {
    return this.expiryDate && new Date() > this.expiryDate;
});

documentSchema.index({ uploadedBy: 1, createdAt: -1 });
documentSchema.index({ folder: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ expiryDate: 1 }, { sparse: true });

module.exports = mongoose.model('Document', documentSchema);
