const User = require('../model/user');
const Leave = require('../model/leave.model');
const LeaveBalance = require('../model/leaveBalance.model');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

const getTeamLeaveRequests = async (managerId) => {
    const teamMembers = await User.find({ manager: managerId }).select('_id').lean();
    const teamMemberIds = teamMembers.map(member => member._id);

    const leaveRequests = await Leave.find({ employee: { $in: teamMemberIds } })
        .populate('employee', 'name email')
        .sort({ createdAt: -1 })
        .lean();

    return leaveRequests;
};

const updateLeaveRequestStatus = async (leaveId, { status, managerNotes }, loggedInUser, req) => {
    const leaveRequest = await Leave.findById(leaveId);

    if (!leaveRequest) {
        throw new Error('NOT_FOUND');
    }

    if (status === 'Denied' && (!managerNotes || managerNotes.trim() === '')) {
        throw new Error('DENIAL_NOTES_REQUIRED');
    }

    const employee = await User.findById(leaveRequest.employee).lean();

    const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
    const isAdmin = ['hr', 'super-admin'].includes(loggedInUser.role);

    if (!isDirectManager && !isAdmin) {
        throw new Error('UNAUTHORIZED');
    }

    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const daysToUpdate = (end - start) / (1000 * 60 * 60 * 24) + 1;
    const previousStatus = leaveRequest.status;

    if (status === 'Approved' && previousStatus !== 'Approved') {
        await LeaveBalance.updateOne(
            { employee: leaveRequest.employee, leavePolicy: leaveRequest.leavePolicy, year: start.getFullYear() },
            { $inc: { daysTaken: daysToUpdate } }
        );
    }

    if (status === 'Denied' && previousStatus === 'Approved') {
        await LeaveBalance.updateOne(
            { employee: leaveRequest.employee, leavePolicy: leaveRequest.leavePolicy, year: start.getFullYear() },
            { $inc: { daysTaken: -daysToUpdate } }
        );
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = loggedInUser.id;
    leaveRequest.managerNotes = managerNotes || '';

    await leaveRequest.save();

    await createNotification({
        recipient: employee._id,
        sender: loggedInUser.id,
        message: `Your leave request from ${start.toLocaleDateString()} to ${end.toLocaleDateString()} has been ${status.toLowerCase()}.`,
        link: '/leave',
        type: 'Leave'
    }, req);

    return leaveRequest;
};

const getMyTeam = async (loggedInUser) => {
    const roleHierarchy = ['employee', 'manager', 'hr', 'super-admin'];
    const userRoleIndex = roleHierarchy.indexOf(loggedInUser.role);

    if (loggedInUser.role === 'super-admin' || loggedInUser.role === 'hr') {
        const assignableRoles = roleHierarchy.slice(0, userRoleIndex);
        const assignableUsers = await User.find({
            role: { $in: assignableRoles },
            _id: { $ne: loggedInUser.id }
        }).select('name email').lean();
        return assignableUsers;
    }

    if (loggedInUser.role === 'manager') {
        const directReports = await User.find({ manager: loggedInUser.id }).select('name email').lean();
        const hrUsers = await User.find({ role: 'hr' }).select('name email').lean();
        return [...directReports, ...hrUsers];
    }

    return [];
};

const getLeaveRequestDetails = async (leaveId, loggedInUser) => {
    const primaryRequest = await Leave.findById(leaveId)
        .populate('employee', 'name department')
        .populate({
            path: 'employee',
            populate: { path: 'department', select: 'name' }
        })
        .lean();

    if (!primaryRequest) {
        throw new Error('NOT_FOUND');
    }

    const isManagerOrAdmin = (primaryRequest.employee.manager?.toString() === loggedInUser.id) ||
        ['hr', 'super-admin'].includes(loggedInUser.role);

    if (!isManagerOrAdmin) {
        throw new Error('UNAUTHORIZED');
    }

    const overlappingLeaves = await Leave.find({
        _id: { $ne: leaveId },
        status: 'Approved',
        startDate: { $lte: primaryRequest.endDate },
        endDate: { $gte: primaryRequest.startDate }
    }).populate({
        path: 'employee',
        select: 'name department',
        populate: { path: 'department', select: 'name' }
    }).lean();

    return {
        request: primaryRequest,
        overlapping: overlappingLeaves
    };
};

module.exports = {
    getTeamLeaveRequests,
    updateLeaveRequestStatus,
    getMyTeam,
    getLeaveRequestDetails
};
