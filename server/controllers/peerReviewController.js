const asyncHandler = require('../utils/asyncHandler');
const peerReviewService = require('../services/peerReviewService');

exports.requestPeerReviews = asyncHandler(async (req, res) => {
    const { reviewId, reviewerIds } = req.body;
    if (!reviewId || !reviewerIds?.length) {
        return res.status(400).json({ success: false, message: 'reviewId and reviewerIds are required.' });
    }
    const result = await peerReviewService.requestPeerReviews(reviewId, reviewerIds, req.user._id, req.ip);
    res.status(201).json({ success: true, data: result });
});

exports.submitPeerReview = asyncHandler(async (req, res) => {
    const result = await peerReviewService.submitPeerReview(req.params.id, req.user._id, req.body);
    res.json({ success: true, data: result });
});

exports.getPeerReviews = asyncHandler(async (req, res) => {
    const result = await peerReviewService.getPeerReviewsForReview(req.params.reviewId);
    res.json({ success: true, data: result });
});
