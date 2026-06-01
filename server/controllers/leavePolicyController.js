const LeavePolicy = require('../model/leavePolicy.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all active leave policies
exports.getAllLeavePolicies = asyncHandler(async (req, res, next) => {
    try {
        const policies = await LeavePolicy.find({ isArchived: false }).sort({ name: 1 });
        res.status(200).json({ success: true, data: policies });
    } catch (error) { next(error); }
    });

// @desc    Admin creates a new leave policy
exports.createLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await LeavePolicy.create(req.body);
        res.status(201).json({ success: true, data: policy });
    } catch (error) { next(error); }
    });

// @desc    Admin updates a leave policy
exports.updateLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await LeavePolicy.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, data: policy });
    } catch (error) { next(error); }
    });

// @desc    Admin archives a leave policy (soft delete)
exports.archiveLeavePolicy = asyncHandler(async (req, res, next) => {
    try {
        const policy = await LeavePolicy.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
        if (!policy) return res.status(404).json({ success: false, message: 'Policy not found' });
        res.status(200).json({ success: true, message: 'Policy archived' });
    } catch (error) { next(error); }
};