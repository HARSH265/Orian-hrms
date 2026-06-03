const express = require('express');
const {
    initiateReviewCycle, getReviewById, getMyReviews, getTeamReviews,
    submitSelfAssessment, submitManagerReview, approveReview, archiveReview,
    addGoal, updateGoal, getReviewHistory, exportReviews,
} = require('../controllers/reviewController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

router.post('/initiate-cycle', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), initiateReviewCycle);
router.get('/export', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), exportReviews);
router.get('/my-reviews', getMyReviews);
router.get('/team-reviews', checkPermissions(PERMISSIONS.VIEW_TEAM_REVIEWS), getTeamReviews);
router.get('/history/:employeeId', getReviewHistory);
router.get('/:id', getReviewById);

router.put('/:id/self-assessment', submitSelfAssessment);
router.put('/:id/manager-review', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), submitManagerReview);
router.put('/:id/approve', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), approveReview);
router.put('/:id/archive', checkPermissions(PERMISSIONS.MANAGE_REVIEWS), archiveReview);
router.put('/:id/goals', addGoal);
router.put('/:id/goals/:goalId', updateGoal);

module.exports = router;
