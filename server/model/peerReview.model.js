const mongoose = require('mongoose');

const PeerReviewSchema = new mongoose.Schema({
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    relationship: { type: String, enum: ['peer', 'subordinate', 'other'], default: 'peer' },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, trim: true },
    strengths: { type: String, trim: true },
    areasForImprovement: { type: String, trim: true },
    status: { type: String, enum: ['Pending', 'Submitted'], default: 'Pending' },
    submittedAt: { type: Date },
}, { timestamps: true });

PeerReviewSchema.index({ review: 1 });
PeerReviewSchema.index({ reviewer: 1 });

module.exports = mongoose.model('PeerReview', PeerReviewSchema);
