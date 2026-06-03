const Referral = require('../model/referral.model');
const { createAuditLog } = require('./auditLogService');
const { parsePagination, buildPagination } = require('../utils/pagination');

const submitReferral = async (referralData, userId, ip) => {
    const referral = await Referral.create(referralData);
    await createAuditLog({
        actor: userId, action: 'REFERRAL_SUBMITTED',
        target: { id: referral._id, type: 'Referral' },
        details: { candidateName: referral.candidateName, job: referral.job },
        ipAddress: ip,
    });
    return referral;
};

const getAllReferrals = async ({ page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (status) query.status = status;
    const [referrals, total] = await Promise.all([
        Referral.find(query)
            .populate('job', 'title')
            .populate('referredBy', 'name email')
            .sort({ createdAt: -1 })
            .lean()
            .skip(skip)
            .limit(l),
        Referral.countDocuments(query),
    ]);
    return { data: referrals, pagination: buildPagination(total, p, l) };
};

const getReferralById = async (id) => {
    const referral = await Referral.findById(id)
        .populate('job', 'title')
        .populate('referredBy', 'name email')
        .lean();
    if (!referral) {
        const err = new Error('Referral not found.');
        err.status = 404;
        throw err;
    }
    return referral;
};

const getMyReferrals = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { referredBy: userId };
    const [referrals, total] = await Promise.all([
        Referral.find(query)
            .populate('job', 'title')
            .sort({ createdAt: -1 })
            .lean()
            .skip(skip)
            .limit(l),
        Referral.countDocuments(query),
    ]);
    return { data: referrals, pagination: buildPagination(total, p, l) };
};

const updateReferralStatus = async (referralId, status, userId, ip) => {
    const validStatuses = ['Submitted', 'In Review', 'Interviewing', 'Hired', 'Not a Fit'];
    if (!validStatuses.includes(status)) {
        const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        err.status = 400;
        throw err;
    }
    const referral = await Referral.findById(referralId);
    if (!referral) {
        const err = new Error('Referral not found.');
        err.status = 404;
        throw err;
    }
    referral.status = status;
    await referral.save();
    await createAuditLog({
        actor: userId, action: 'REFERRAL_STATUS_UPDATED',
        target: { id: referralId, type: 'Referral' },
        details: { status },
        ipAddress: ip,
    });
    return referral;
};

const exportReferralsCSV = async (filter = {}) => {
    const referrals = await Referral.find(filter)
        .populate('job', 'title')
        .populate('referredBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Candidate Name,Candidate Email,Candidate Phone,Job,Referred By,Status,Created At\n';
    const rows = referrals.map(r =>
        `"${(r.candidateName || '').replace(/"/g, '""')}","${(r.candidateEmail || '').replace(/"/g, '""')}","${(r.candidatePhone || '').replace(/"/g, '""')}","${r.job?.title || ''}","${r.referredBy?.name || ''}",${r.status},${new Date(r.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    submitReferral, getAllReferrals, getReferralById, getMyReferrals,
    updateReferralStatus, exportReferralsCSV,
};
