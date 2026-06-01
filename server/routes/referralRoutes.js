const express = require('express');
const {
    submitReferral,
    getAllReferrals,
    updateReferralStatus
} = require('../controllers/referralController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require login
router.use(protect);

// Submitting a referral is open to everyone
router.route('/').post(submitReferral);

// Viewing and managing referrals is admin-only
router.route('/').get(checkPermissions(PERMISSIONS.MANAGE_REFERRALS), getAllReferrals);
router.route('/:id').put(checkPermissions(PERMISSIONS.MANAGE_REFERRALS), updateReferralStatus);

module.exports = router;