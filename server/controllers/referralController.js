const asyncHandler = require('../utils/asyncHandler');
const referralService = require('../services/referralService');

exports.submitReferral = asyncHandler(async (req, res, next) => {
    try {
        const { candidateName, candidateEmail, candidatePhone, job, resumeUrl } = req.body;
        const referral = await referralService.submitReferral(
            { candidateName, candidateEmail, candidatePhone, job, resumeUrl, referredBy: req.user.id }, req.user.id, req.ip
        );
        res.status(201).json({ success: true, data: referral });
    } catch (error) { next(error); }
});

exports.getAllReferrals = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await referralService.getAllReferrals({ page, limit, status });
    res.json({ success: true, ...result });
});

exports.getReferralById = asyncHandler(async (req, res, next) => {
    try {
        const referral = await referralService.getReferralById(req.params.id);
        res.json({ success: true, data: referral });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.getMyReferrals = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await referralService.getMyReferrals(req.user.id, { page, limit });
    res.json({ success: true, ...result });
});

exports.updateReferralStatus = asyncHandler(async (req, res, next) => {
    try {
        const referral = await referralService.updateReferralStatus(req.params.id, req.body.status, req.user.id, req.ip);
        res.json({ success: true, data: referral });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.exportReferrals = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const csv = await referralService.exportReferralsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="referrals-export.csv"');
    res.send(csv);
});
