const { submitReferral, getAllReferrals, updateReferralStatus } = require('../services/referralService');

exports.submitReferral = async (req, res, next) => {
    try {
        const referral = await submitReferral({ ...req.body, referredBy: req.user.id });
        res.status(201).json({ success: true, data: referral });
    } catch (error) { next(error); }
};

exports.getAllReferrals = async (req, res, next) => {
    try {
        const referrals = await getAllReferrals();
        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (error) { next(error); }
};

exports.updateReferralStatus = async (req, res, next) => {
    try {
        const referral = await updateReferralStatus(req.params.id, req.body.status);
        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }
        res.status(200).json({ success: true, data: referral });
    } catch (error) { next(error); }
};
