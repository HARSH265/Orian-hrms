const Leave = require('../model/leave.model');
const User = require('../model/user');
const LeavePolicy = require('../model/leavePolicy.model');
const LeaveBalance = require('../model/leaveBalance.model');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

const applyForLeave = async (employee, { startDate, endDate, reason, leavePolicyId, attachments }, req) => {
    const policy = await LeavePolicy.findById(leavePolicyId).lean();
    if (!policy) {
        throw new Error('INVALID_POLICY');
    }

    if (policy.requiresAttachment && (!attachments || attachments.length === 0)) {
        throw new Error('ATTACHMENT_REQUIRED');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const requestedDays = (end - start) / (1000 * 60 * 60 * 24) + 1;

    const currentYear = start.getFullYear();
    const balance = await LeaveBalance.findOne({
        employee: employee.id,
        leavePolicy: leavePolicyId,
        year: currentYear
    }).lean();

    if (!balance) {
        throw new Error('NO_BALANCE');
    }

    const remainingDays = balance.totalDays - balance.daysTaken;
    if (remainingDays < requestedDays) {
        throw new Error(`Insufficient leave balance. You have ${remainingDays} days remaining.`);
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
        }, req);
    }

    return leaveRequest;
};

const getMyLeaveHistory = async (employeeId) => {
    const leaveHistory = await Leave.find({ employee: employeeId })
        .populate('leavePolicy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
    return leaveHistory;
};

const withdrawLeaveRequest = async (leaveId, employee, req) => {
    const leaveRequest = await Leave.findById(leaveId);

    if (!leaveRequest) {
        throw new Error('NOT_FOUND');
    }

    if (leaveRequest.employee.toString() !== employee.id.toString()) {
        throw new Error('UNAUTHORIZED');
    }

    if (leaveRequest.status !== 'Pending') {
        throw new Error(`Cannot withdraw a request that has already been ${leaveRequest.status.toLowerCase()}.`);
    }

    leaveRequest.status = 'Withdrawn';
    await leaveRequest.save();

    if (employee.manager) {
        await createNotification({
            recipient: employee.manager,
            sender: employee.id,
            message: `${employee.name} has withdrawn their leave request.`,
            link: '/team',
            type: 'Leave',
        }, req);
    }

    return leaveRequest;
};

module.exports = { applyForLeave, getMyLeaveHistory, withdrawLeaveRequest };
