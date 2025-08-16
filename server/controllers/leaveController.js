const Leave = require('../model/leave.model');
const User = require('../model/user'); 
const { createNotification } = require('../services/notificationService');

// @desc    Apply for leave
// @route   POST /api/leave
// @access  Private (Employee)
exports.applyForLeave = async (req, res, next) => {
    try {
        const { startDate, endDate, reason } = req.body;
        const employee = req.user; // Use the full user object

        const leaveRequest = await Leave.create({
            employee: employee.id,
            startDate,
            endDate,
            reason,
        });

        // --- 2. ADD NOTIFICATION LOGIC ---
        // If the employee has a manager, send them a notification.
        if (employee.manager) {
            await createNotification({
                recipient: employee.manager,
                sender: employee.id,
                message: `${employee.name} has submitted a new leave request.`,
                link: '/team', // Link to the manager's team approval page
                type: 'Leave',
            });
        }
        // --- END NOTIFICATION LOGIC ---
        
        res.status(201).json({ success: true, data: leaveRequest });
    } catch (error) {
        next(error);
    }
};

// @desc    Get my leave history
// @route   GET /api/leave/my-history
// @access  Private (Employee)
exports.getMyLeaveHistory = async (req, res, next) => {
    try {
        const leaveHistory = await Leave.find({ employee: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: leaveHistory.length, data: leaveHistory });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Withdraw a leave request
 * @route   PUT /api/leave/:id/withdraw
 * @access  Private (Employee)
 */
exports.withdrawLeaveRequest = async (req, res, next) => {
    try {
        const leaveId = req.params.id;
        const employee = req.user; // Use the full user object

        const leaveRequest = await Leave.findById(leaveId);

        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leaveRequest.employee.toString() !== employee.id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to withdraw this request.' });
        }

        if (leaveRequest.status !== 'Pending') {
            return res.status(400).json({ success: false, message: `You cannot withdraw a request that has already been ${leaveRequest.status.toLowerCase()}.` });
        }

        leaveRequest.status = 'Withdrawn';
        await leaveRequest.save();

        // --- 3. ADD NOTIFICATION LOGIC ---
        // Notify the manager that the request was withdrawn.
        if (employee.manager) {
             await createNotification({
                recipient: employee.manager,
                sender: employee.id,
                message: `${employee.name} has withdrawn their leave request.`,
                link: '/team',
                type: 'Leave',
            });
        }
        // --- END NOTIFICATION LOGIC ---

        res.status(200).json({ success: true, data: leaveRequest });

    } catch (error) {
        next(error);
    }
};