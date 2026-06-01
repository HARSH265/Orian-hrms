const Leave = require('../model/leave.model');
const asyncHandler = require('../utils/asyncHandler'); 

/**
 * @desc    Get ALL leave requests in the system (for Admin view)
 * @route   GET /api/admin/leave-requests
 * @access  Private (HR, Super-Admin)
 */
exports.getAllLeaveRequests = asyncHandler(async (req, res, next) => {
    try {
        // Find all leave requests and populate all necessary details for the UI.
        const allLeaveRequests = await Leave.find({})
            // --- THE FIX: Chain the additional .populate() calls ---
            .populate('employee', 'name email')
            .populate('leavePolicy', 'name')     // This will fetch the leave type name
            .populate('approvedBy', 'name')      // This will fetch the approver's name
            // --- END OF FIX ---
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: allLeaveRequests.length, data: allLeaveRequests });
    } catch (error) {
        next(error);
    }
    });