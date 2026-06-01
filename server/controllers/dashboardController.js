const { getDataHealth, getTaskMetrics, getLeaveMetrics } = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get data for the admin data health dashboard
// @route   GET /api/dashboard/data-health
// @access  Private/Admin
exports.getDataHealth = asyncHandler(async (req, res, next) => {
    try {
        const data = await getDataHealth();
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// @desc    Get key performance metrics for tasks
// @route   GET /api/dashboard/task-metrics
// @access  Private (Manager, HR, Admin)
exports.getTaskMetrics = asyncHandler(async (req, res, next) => {
    try {
        const formattedMetrics = await getTaskMetrics();
        res.status(200).json({ success: true, data: formattedMetrics });
    } catch (error) {
        next(error);
    }
});

// @desc    Get key performance metrics for leave requests
// @route   GET /api/dashboard/leave-metrics
// @access  Private (Manager, HR, Admin)
exports.getLeaveMetrics = asyncHandler(async (req, res, next) => {
    try {
        const formattedMetrics = await getLeaveMetrics();
        res.status(200).json({ success: true, data: formattedMetrics });
    } catch (error) {
        next(error);
    }
});
