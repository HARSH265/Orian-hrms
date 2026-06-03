const mongoose = require('mongoose');

const DocumentFavoriteSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
}, { timestamps: true });

DocumentFavoriteSchema.index({ user: 1, document: 1 }, { unique: true });

module.exports = mongoose.model('DocumentFavorite', DocumentFavoriteSchema);
