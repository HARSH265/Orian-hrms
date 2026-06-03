const mongoose = require('mongoose');

const AssetLogSchema = new mongoose.Schema({
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    action: { type: String, required: true, enum: ['assigned', 'unassigned', 'status_changed', 'created', 'updated', 'maintenance_due'] },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
}, { timestamps: true });

AssetLogSchema.index({ asset: 1, createdAt: -1 });

module.exports = mongoose.model('AssetLog', AssetLogSchema);
