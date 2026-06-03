const mongoose = require('mongoose');

const DocumentFolderSchema = new mongoose.Schema({
    name: { type: String, required: [true, 'Folder name is required.'], trim: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentFolder', default: null },
    description: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

DocumentFolderSchema.index({ parent: 1 });
DocumentFolderSchema.index({ name: 1, parent: 1 }, { unique: true });

module.exports = mongoose.model('DocumentFolder', DocumentFolderSchema);
