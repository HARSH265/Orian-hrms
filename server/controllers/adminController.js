const Leave = require('../model/leave.model'); 

/**
 * @desc    Get ALL leave requests in the system (for Admin view)
 * @route   GET /api/admin/leave-requests
 * @access  Private (HR, Super-Admin)
 */
exports.getAllLeaveRequests = async (req, res, next) => {
    try {
        // Find all leave requests, regardless of who submitted them.
        // We populate the employee's details to display in the admin table.
        const allLeaveRequests = await Leave.find({})
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: allLeaveRequests.length, data: allLeaveRequests });
    } catch (error) {
        next(error);
    }
};