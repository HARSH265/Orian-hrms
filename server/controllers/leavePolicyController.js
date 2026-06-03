const asyncHandler = require('../utils/asyncHandler');
const {
    getAllLeavePolicies, createLeavePolicy, updateLeavePolicy, archiveLeavePolicy, unarchiveLeavePolicy,
} = require('../services/leavePolicyService');

exports.getAllLeavePolicies = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit, includeArchived } = req.query;
        const result = await getAllLeavePolicies({ page, limit, includeArchived });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
});

exports.createLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await createLeavePolicy(req.body, req.user.id);
        res.status(201).json({ success: true, data: policy });
    } catch (error) { next(error); }
});

exports.updateLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await updateLeavePolicy(req.params.id, req.body, req.user.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, data: policy });
    } catch (error) { next(error); }
});

exports.archiveLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await archiveLeavePolicy(req.params.id, req.user.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, message: 'Policy archived' });
    } catch (error) { next(error); }
});

exports.unarchiveLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await unarchiveLeavePolicy(req.params.id, req.user.id);
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, data: policy });
    } catch (error) { next(error); }
});
