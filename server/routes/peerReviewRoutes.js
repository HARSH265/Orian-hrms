const express = require('express');
const { requestPeerReviews, submitPeerReview, getPeerReviews } = require('../controllers/peerReviewController');
const { protect } = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const router = express.Router();

router.use(protect);

router.post('/request', writeLimiter, requestPeerReviews);
router.get('/:reviewId', getPeerReviews);
router.put('/:id/submit', writeLimiter, submitPeerReview);

module.exports = router;
