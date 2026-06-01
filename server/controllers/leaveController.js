const asyncHandler = require('../utils/asyncHandler');
const { applyForLeave, getMyLeaveHistory, withdrawLeaveRequest } = require('../services/leaveService');

exports.applyForLeave = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate, reason, leavePolicyId, attachments } = req.body;
        const leaveRequest = await applyForLeave(req.user, { startDate, endDate, reason, leavePolicyId, attachments }, req);
        res.status(201).json({ success: true, data: leaveRequest });
    } catch (error) {
        if (error.message === 'INVALID_POLICY') {
            return res.status(400).json({ success: false, message: 'Invalid leave policy selected.' });
        }
        if (error.message === 'ATTACHMENT_REQUIRED') {
            return res.status(400).json({ success: false, message: error.message });
        }
        if (error.message === 'NO_BALANCE') {
            return res.status(400).json({ success: false, message: 'You are not assigned this leave policy for the current year.' });
        }
        if (error.message.startsWith('Insufficient leave balance')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

exports.getMyLeaveHistory = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getMyLeaveHistory(req.user.id, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.withdrawLeaveRequest = asyncHandler(async (req, res, next) => {
    try {
        const leaveRequest = await withdrawLeaveRequest(req.params.id, req.user, req);
        res.status(200).json({ success: true, data: leaveRequest });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }
        if (error.message === 'UNAUTHORIZED') {
            return res.status(403).json({ success: false, message: 'You are not authorized to withdraw this request.' });
        }
        if (error.message.startsWith('Cannot withdraw a request')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});
