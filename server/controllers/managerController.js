const User = require('../model/user');
const Leave = require('../model/leave.model'); 
const { createNotification } = require('../services/notificationService');
/**
 * @desc    Get all leave requests for the manager's team
 * @route   GET /api/manager/team-leave-requests
 * @access  Private (Manager, HR, Super-Admin)
 */
exports.getTeamLeaveRequests = async (req, res, next) => {
    try {
        // 1. Find all users who report to the current manager
        const teamMembers = await User.find({ manager: req.user.id }).select('_id');

        // 2. Extract just the IDs of the team members into an array
        const teamMemberIds = teamMembers.map(member => member._id);

        // 3. Find all leave requests submitted by those team members
        // We use .populate() to also get the employee's name and email for the frontend
        const leaveRequests = await Leave.find({ employee: { $in: teamMemberIds } })
            .populate('employee', 'name email') // 'employee' is the field, 'name email' are the fields to fetch from the User model
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: leaveRequests.length, data: leaveRequests });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update the status of a leave request (Approve/Deny)
 * @route   PUT /api/manager/leave-requests/:id
 * @access  Private (Manager, HR, Super-Admin)
 */
exports.updateLeaveRequestStatus = async (req, res, next) => {
    try {
        const { status, managerNotes } = req.body; // Get new status from request body

        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status provided.' });
        }

        const leaveRequest = await Leave.findById(req.params.id);

        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        // --- CRITICAL SECURITY CHECK ---

        const employee = await User.findById(leaveRequest.employee);
        const loggedInUser = req.user;

        const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
        const isAdmin = loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin';

        // The user is authorized IF they are the direct manager OR they are an admin.
        if (!isDirectManager && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this leave request.' });
        }

        leaveRequest.status = status;
        if (managerNotes) {
            leaveRequest.managerNotes = managerNotes;
        }

        await leaveRequest.save();

        if (status === 'Approved' || status === 'Denied') {
    await createNotification({
        recipient: employee._id,
        sender: loggedInUser.id,
        message: `Your leave request has been ${status.toLowerCase()}.`,
        link: '/leave', // Link to the employee's leave page
        type: 'Leave',
    });
}

        res.status(200).json({ success: true, data: leaveRequest });

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get the logged-in manager's direct reports
 * @route   GET /api/manager/my-team
 * @access  Private (Manager+)
 */
exports.getMyTeam = async (req, res, next) => {
    try {
        const loggedInUser = req.user;
        let query = {};

        const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
        const userRoleIndex = roleHierarchy.indexOf(loggedInUser.role);

        if (loggedInUser.role === 'super-admin' || loggedInUser.role === 'hr') {
            const assignableRoles = roleHierarchy.slice(0, userRoleIndex);
            query = { role: { $in: assignableRoles } };
        } 
        else if (loggedInUser.role === 'manager') {
            // Managers can only assign to their direct reports and HR.
            // We handle this on the client, but the backend query will be simpler.
            const directReports = await User.find({ manager: loggedInUser.id }).select('name email');
            const hrUsers = await User.find({ role: 'hr' }).select('name email');
            const finalUserList = [...directReports, ...hrUsers];
            return res.status(200).json({ success: true, count: finalUserList.length, data: finalUserList });
        }
        else {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        // --- THIS IS THE KEY FIX ---
        // Ensure the logged-in user themselves is not in the list
        const assignableUsers = await User.find({ ...query, _id: { $ne: loggedInUser.id } }).select('name email');
        
        res.status(200).json({ success: true, count: assignableUsers.length, data: assignableUsers });

    } catch (error) {
        next(error);
    }
};