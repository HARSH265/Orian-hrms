const express = require('express');
const {
    submitReferral,
    getAllReferrals,
    updateReferralStatus
} = require('../controllers/referralController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);

// Submitting a referral is open to everyone
router.route('/').post(submitReferral);

// Viewing and managing referrals is admin-only
router.route('/').get(authorize('hr', 'super-admin'), getAllReferrals);
router.route('/:id').put(authorize('hr', 'super-admin'), updateReferralStatus);

module.exports = router;