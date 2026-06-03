const asyncHandler = require('../utils/asyncHandler');
const leaveService = require('../services/leaveService');
const { ERROR_CODES } = leaveService;

const ERROR_STATUS_MAP = {
  [ERROR_CODES.INVALID_POLICY]: 400,
  [ERROR_CODES.ATTACHMENT_REQUIRED]: 400,
  [ERROR_CODES.PAST_DATE]: 400,
  [ERROR_CODES.OVERLAPPING]: 409,
  [ERROR_CODES.NO_BALANCE]: 400,
  [ERROR_CODES.INSUFFICIENT_BALANCE]: 400,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.UNAUTHORIZED]: 403,
  [ERROR_CODES.INVALID_DATES]: 400,
  [ERROR_CODES.EXCEEDS_MAX]: 400,
};

function handleServiceError(res, error, next) {
  const status = ERROR_STATUS_MAP[error.code];
  if (status) return res.status(status).json({ success: false, message: error.message });
  next(error);
}

exports.applyForLeave = asyncHandler(async (req, res, next) => {
    try {
        const { startDate, endDate, reason, leavePolicyId, attachments } = req.body;
        const leaveRequest = await leaveService.applyForLeave(req.user, { startDate, endDate, reason, leavePolicyId, attachments }, req);
        res.status(201).json({ success: true, data: leaveRequest });
    } catch (error) {
        handleServiceError(res, error, next);
    }
});

exports.getMyLeaveHistory = asyncHandler(async (req, res) => {
    const { page, limit, status, startDate, endDate } = req.query;
    const result = await leaveService.getMyLeaveHistory(req.user.id, { page, limit, status, startDate, endDate });
    res.status(200).json({ success: true, ...result });
});

exports.withdrawLeaveRequest = asyncHandler(async (req, res, next) => {
    try {
        const leaveRequest = await leaveService.withdrawLeaveRequest(req.params.id, req.user, req);
        res.status(200).json({ success: true, data: leaveRequest });
    } catch (error) {
        handleServiceError(res, error, next);
    }
});

exports.getTeamLeaves = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await leaveService.getTeamLeaves(req.user.id, { page, limit, status });
    res.json({ success: true, ...result });
});

exports.reviewLeaveRequest = asyncHandler(async (req, res, next) => {
    try {
        const { action, managerNotes } = req.body;
        if (!action || !['Approved', 'Denied'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Action must be "Approved" or "Denied".' });
        }
        const result = await leaveService.reviewLeaveRequest(req.params.id, req.user.id, action, managerNotes, req);
        res.json({ success: true, data: result });
    } catch (error) {
        handleServiceError(res, error, next);
    }
});

exports.getAllLeaves = asyncHandler(async (req, res) => {
    const { page, limit, status, leavePolicyId, startDate, endDate } = req.query;
    const result = await leaveService.getAllLeaves({ page, limit, status, leavePolicyId, startDate, endDate });
    res.json({ success: true, ...result });
});

exports.getLeaveSummary = asyncHandler(async (req, res) => {
    const employeeId = req.params.employeeId || req.user.id;
    const result = await leaveService.getLeaveSummary(employeeId);
    res.json({ success: true, data: result });
});

exports.exportLeaves = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.leavePolicyId) filter.leavePolicy = req.query.leavePolicyId;
    const csv = await leaveService.exportLeavesCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leaves-export.csv"');
    res.send(csv);
});
