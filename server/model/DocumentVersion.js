const mongoose = require('mongoose');

const DocumentVersionSchema = new mongoose.Schema({
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    version: { type: Number, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeNotes: { type: String, trim: true },
}, { timestamps: true });

DocumentVersionSchema.index({ document: 1, version: -1 });

module.exports = mongoose.model('DocumentVersion', DocumentVersionSchema);
