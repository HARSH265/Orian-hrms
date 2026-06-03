const { getLeaveByDepartment, getExpensesByCategory } = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');

exports.getLeaveByDepartment = asyncHandler(async (req, res) => {
    const data = await getLeaveByDepartment();
    res.status(200).json({ success: true, data });
});

exports.getExpensesByCategory = asyncHandler(async (req, res) => {
    const data = await getExpensesByCategory();
    res.status(200).json({ success: true, data });
});
