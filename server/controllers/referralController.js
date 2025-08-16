const Referral = require('../model/referral.model');

exports.submitReferral = async (req, res, next) => {
    try {
        req.body.referredBy = req.user.id;
        const referral = await Referral.create(req.body);
        res.status(201).json({ success: true, data: referral });
    } catch (error) { next(error); }
};

exports.getAllReferrals = async (req, res, next) => {
    try {
        const referrals = await Referral.find({})
            .populate('job', 'title')
            .populate('referredBy', 'name email');
        res.status(200).json({ success: true, count: referrals.length, data: referrals });
    } catch (error) { next(error); }
};

exports.updateReferralStatus = async (req, res, next) => {
    try {
        let referral = await Referral.findById(req.params.id);
        if (!referral) {
            return res.status(404).json({ success: false, message: 'Referral not found' });
        }
        // Only allow updating the status
        referral.status = req.body.status;
        await referral.save();
        res.status(200).json({ success: true, data: referral });
    } catch (error) { next(error); }
};