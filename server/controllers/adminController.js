const { getAllLeaves } = require('../services/leaveService');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllLeaveRequests = asyncHandler(async (req, res) => {
    const { page, limit, status, leavePolicyId, startDate, endDate } = req.query;
    const result = await getAllLeaves({ page, limit, status, leavePolicyId, startDate, endDate });
    res.status(200).json({ success: true, ...result });
});
