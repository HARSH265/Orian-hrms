const Leave = require('../model/leave.model');
const User = require('../model/user'); 
const LeavePolicy = require('../model/leavePolicy.model');
const LeaveBalance = require('../model/leaveBalance.model');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Apply for leave
// @route   POST /api/leave
// @access  Private (Employee)
exports.applyForLeave = asyncHandler(async (req, res, next) => {
    // ... The rest of your function will now work perfectly ...
    try {
        const { startDate, endDate, reason, leavePolicyId, attachments } = req.body;
        const employee = req.user;

        const policy = await LeavePolicy.findById(leavePolicyId);
        if (!policy) {
            return res.status(400).json({ success: false, message: "Invalid leave policy selected." });
        }

        if (policy.requiresAttachment && (!attachments || attachments.length === 0)) {
            return res.status(400).json({ 
                success: false, 
                message: `An attachment is required for the '${policy.name}' policy.` 
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const requestedDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

        const currentYear = start.getFullYear();
        const balance = await LeaveBalance.findOne({
            employee: employee.id,
            leavePolicy: leavePolicyId,
            year: currentYear
        });

        if (!balance) {
            return res.status(400).json({ success: false, message: "You are not assigned this leave policy for the current year." });
        }

        const remainingDays = balance.totalDays - balance.daysTaken;
        if (remainingDays < requestedDays) {
            return res.status(400).json({ success: false, message: `Insufficient leave balance. You have ${remainingDays} days remaining.` });
        }

        const leaveRequest = await Leave.create({
            employee: employee.id,
            startDate,
            endDate,
            reason,
            leavePolicy: leavePolicyId,
            attachments: attachments || []
        });

        if (employee.manager) {
            await createNotification({
                recipient: employee.manager,
                sender: employee.id,
                message: `${employee.name} has submitted a new leave request.`,
                link: '/team',
                type: 'Leave',
            },req);
        }
        
        res.status(201).json({ success: true, data: leaveRequest });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get my leave history
// @route   GET /api/leave/my-history
// @access  Private (Employee)
exports.getMyLeaveHistory = asyncHandler(async (req, res, next) => {
    try {
        // --- THE FIX: Add .populate() to get more details ---
        const leaveHistory = await Leave.find({ employee: req.user.id })
            .populate('leavePolicy', 'name') // Get the policy name
            .populate('approvedBy', 'name')  // Get the name of the user who approved/denied
            .sort({ createdAt: -1 });
        // --- END OF FIX ---

        res.status(200).json({ success: true, count: leaveHistory.length, data: leaveHistory });
    } catch (error) {
        next(error);
    }
    });

/**
 * @desc    Withdraw a leave request
 * @route   PUT /api/leave/:id/withdraw
 * @access  Private (Employee)
 */
exports.withdrawLeaveRequest = asyncHandler(async (req, res, next) => {
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
            },req);
        }
        // --- END NOTIFICATION LOGIC ---

        res.status(200).json({ success: true, data: leaveRequest });

    } catch (error) {
        next(error);
    }
};