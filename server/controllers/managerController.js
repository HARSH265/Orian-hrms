const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const {
    getTeamLeaveRequests,
    updateLeaveRequestStatus,
    getMyTeam,
    getLeaveRequestDetails
} = require('../services/managerService');

exports.getTeamLeaveRequests = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getTeamLeaveRequests(req.user.id, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.updateLeaveRequestStatus = asyncHandler(async (req, res, next) => {
    try {
        const { status, managerNotes } = req.body;

        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const leaveRequest = await updateLeaveRequestStatus(req.params.id, { status, managerNotes }, req.user, req);
        res.status(200).json({ success: true, data: leaveRequest });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }
        if (error.message === 'DENIAL_NOTES_REQUIRED') {
            return res.status(400).json({ success: false, message: 'A reason (manager notes) is required to deny a request.' });
        }
        if (error.message === 'UNAUTHORIZED') {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this leave request.' });
        }
        logger.error("CRASH in updateLeaveRequestStatus:", error);
        next(error);
    }
});

exports.getMyTeam = asyncHandler(async (req, res, next) => {
    try {
        const assignableUsers = await getMyTeam(req.user);
        res.status(200).json({ success: true, count: assignableUsers.length, data: assignableUsers });
    } catch (error) {
        next(error);
    }
});

exports.getLeaveRequestDetails = asyncHandler(async (req, res, next) => {
    try {
        const data = await getLeaveRequestDetails(req.params.id, req.user);
        res.status(200).json({ success: true, data });
    } catch (error) {
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }
        if (error.message === 'UNAUTHORIZED') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this request.' });
        }
        next(error);
    }
});
