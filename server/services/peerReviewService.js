const PeerReview = require('../model/peerReview.model');
const Review = require('../model/review.model');
const { createAuditLog } = require('./auditLogService');

const err = (msg, s) => { const e = new Error(msg); e.status = s; return e; };

const requestPeerReviews = async (reviewId, reviewerIds, userId, ip) => {
    const review = await Review.findById(reviewId);
    if (!review) throw err('Review not found.', 404);
    if (review.employee.toString() !== userId.toString()) throw err('Only the employee can request peer reviews.', 403);
    if (review.status !== 'Pending Self-Assessment') throw err('Cannot request peer reviews at this stage.', 400);

    const existing = await PeerReview.find({ review: reviewId, reviewer: { $in: reviewerIds } });
    const existingIds = existing.map(p => p.reviewer.toString());
    const toCreate = reviewerIds.filter(id => !existingIds.includes(id))
        .map(reviewer => ({ review: reviewId, reviewer }));
    const created = await PeerReview.insertMany(toCreate);
    return created;
};

const submitPeerReview = async (peerReviewId, userId, data) => {
    const peer = await PeerReview.findById(peerReviewId);
    if (!peer) throw err('Peer review request not found.', 404);
    if (peer.reviewer.toString() !== userId.toString()) throw err('Not authorized.', 403);
    if (peer.status !== 'Pending') throw err('Peer review already submitted.', 400);

    peer.rating = data.rating;
    peer.feedback = data.feedback;
    peer.strengths = data.strengths;
    peer.areasForImprovement = data.areasForImprovement;
    peer.status = 'Submitted';
    peer.submittedAt = new Date();
    await peer.save();
    return peer;
};

const getPeerReviewsForReview = async (reviewId) => {
    const peers = await PeerReview.find({ review: reviewId })
        .populate('reviewer', 'name')
        .sort({ createdAt: -1 });
    return peers;
};

module.exports = { requestPeerReviews, submitPeerReview, getPeerReviewsForReview };
