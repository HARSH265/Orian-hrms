const mongoose = require('mongoose');

const AssetRequestSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assetType: { type: String, required: true, enum: ['Hardware', 'Software', 'License', 'Other'] },
    justification: { type: String, required: true, trim: true },
    preferredAsset: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Fulfilled'], default: 'Pending' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },
    fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fulfilledAt: { type: Date },
    linkedAsset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
}, { timestamps: true });

AssetRequestSchema.index({ employee: 1, status: 1 });
AssetRequestSchema.index({ status: 1 });

module.exports = mongoose.model('AssetRequest', AssetRequestSchema);
