const mongoose = require('mongoose');

const DocumentActivitySchema = new mongoose.Schema({
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
        type: String,
        enum: ['uploaded', 'updated', 'downloaded', 'viewed', 'deleted', 'restored', 'acknowledged', 'shared'],
        required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

DocumentActivitySchema.index({ document: 1, createdAt: -1 });
DocumentActivitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DocumentActivity', DocumentActivitySchema);
