const express = require('express');
const {
    submitReferral, getAllReferrals, getReferralById, getMyReferrals,
    updateReferralStatus, exportReferrals,
} = require('../controllers/referralController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { featureEnabled } = require('../middleware/featureToggle');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);
router.use(featureEnabled('referrals'));

router.get('/my-referrals', getMyReferrals);
router.get('/export', checkPermissions(PERMISSIONS.MANAGE_REFERRALS), exportReferrals);

router.route('/')
    .post(submitReferral)
    .get(checkPermissions(PERMISSIONS.MANAGE_REFERRALS), getAllReferrals);

router.route('/:id')
    .get(getReferralById)
    .put(checkPermissions(PERMISSIONS.MANAGE_REFERRALS), updateReferralStatus);

module.exports = router;
