const Referral = require('../model/referral.model');
const logger = require('../utils/logger');

const submitReferral = async (referralData) => {
    const referral = await Referral.create(referralData);
    return referral;
};

const getAllReferrals = async () => {
    const referrals = await Referral.find({})
        .populate('job', 'title')
        .populate('referredBy', 'name email')
        .lean();
    return referrals;
};

const updateReferralStatus = async (referralId, status) => {
    const referral = await Referral.findById(referralId);
    if (!referral) return null;
    referral.status = status;
    await referral.save();
    return referral;
};

module.exports = { submitReferral, getAllReferrals, updateReferralStatus };
