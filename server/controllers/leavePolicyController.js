const asyncHandler = require('../utils/asyncHandler');
const {
    getAllLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    archiveLeavePolicy
} = require('../services/leavePolicyService');

exports.getAllLeavePolicies = asyncHandler(async (req, res, next) => {
    try {
        const policies = await getAllLeavePolicies();
        res.status(200).json({ success: true, data: policies });
    } catch (error) {
        next(error);
    }
});

exports.createLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await createLeavePolicy(req.body);
        res.status(201).json({ success: true, data: policy });
    } catch (error) {
        next(error);
    }
});

exports.updateLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await updateLeavePolicy(req.params.id, req.body);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, data: policy });
    } catch (error) {
        next(error);
    }
});

exports.archiveLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await archiveLeavePolicy(req.params.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, message: 'Policy archived' });
    } catch (error) {
        next(error);
    }
});
