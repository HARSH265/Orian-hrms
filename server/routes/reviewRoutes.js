const express = require('express');
const {
    initiateReviewCycle,
    getMyReviews,
    getTeamReviews,
    submitSelfAssessment,
    submitManagerReview
} = require('../controllers/reviewController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

// --- Admin Route ---
router.post('/initiate-cycle', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), initiateReviewCycle);

// --- Employee Route ---
router.get('/my-reviews', getMyReviews);
router.put('/:id/self-assessment', submitSelfAssessment);

// --- Manager Route ---
router.get('/team-reviews', checkPermissions(PERMISSIONS.VIEW_TEAM_REVIEWS), getTeamReviews);
router.put('/:id/manager-review', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), submitManagerReview);

module.exports = router;