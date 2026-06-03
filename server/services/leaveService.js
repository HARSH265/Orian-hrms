const Leave = require('../model/leave.model');
const User = require('../model/user');
const LeavePolicy = require('../model/leavePolicy.model');
const LeaveBalance = require('../model/leaveBalance.model');
const { createNotification } = require('./notificationService');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { getDescendantIds } = require('../utils/teamTree');

const ERROR_CODES = {
  INVALID_POLICY: 'INVALID_POLICY',
  ATTACHMENT_REQUIRED: 'ATTACHMENT_REQUIRED',
  PAST_DATE: 'PAST_DATE',
  OVERLAPPING: 'OVERLAPPING',
  NO_BALANCE: 'NO_BALANCE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_DATES: 'INVALID_DATES',
  EXCEEDS_MAX: 'EXCEEDS_MAX',
};

function toUTCDate(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function getUTCToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function getBusinessDays(start, end) {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) count++;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

function buildLeaveError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

const applyForLeave = async (employee, { startDate, endDate, reason, leavePolicyId, attachments }, req) => {
    const policy = await LeavePolicy.findById(leavePolicyId).lean();
    if (!policy) throw buildLeaveError(ERROR_CODES.INVALID_POLICY, 'Invalid leave policy selected.');
    if (policy.isArchived) throw buildLeaveError(ERROR_CODES.INVALID_POLICY, 'This leave policy is archived.');

    if (policy.requiresAttachment && (!attachments || attachments.length === 0)) {
      throw buildLeaveError(ERROR_CODES.ATTACHMENT_REQUIRED, 'Attachment is required for this leave type.');
    }

    const start = toUTCDate(startDate);
    const end = toUTCDate(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw buildLeaveError(ERROR_CODES.INVALID_DATES, 'Invalid start or end date provided.');
    }

    if (end < start) {
      throw buildLeaveError(ERROR_CODES.INVALID_DATES, 'End date cannot be before start date.');
    }

    const today = getUTCToday();
    if (start < today) {
      throw buildLeaveError(ERROR_CODES.PAST_DATE, 'Cannot request leave for past dates.');
    }

    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });
    if (overlappingLeave) {
      throw buildLeaveError(ERROR_CODES.OVERLAPPING, 'You already have a leave request for these dates.');
    }

    const requestedDays = getBusinessDays(start, end);
    const startYear = start.getUTCFullYear();
    const endYear = end.getUTCFullYear();

    if (startYear !== endYear) {
      const startBalance = await LeaveBalance.findOne({
        employee: employee._id, leavePolicy: leavePolicyId, year: startYear,
      }).lean();
      const endBalance = await LeaveBalance.findOne({
        employee: employee._id, leavePolicy: leavePolicyId, year: endYear,
      }).lean();
      if (!startBalance || !endBalance) {
        throw buildLeaveError(ERROR_CODES.NO_BALANCE, 'You do not have a leave balance assigned for one of the years this leave spans.');
      }
    }

    const balance = await LeaveBalance.findOne({
      employee: employee._id,
      leavePolicy: leavePolicyId,
      year: startYear,
    }).lean();

    if (!balance) {
      throw buildLeaveError(ERROR_CODES.NO_BALANCE, 'You are not assigned this leave policy for the current year.');
    }

    if (policy.maxConsecutiveDays && requestedDays > policy.maxConsecutiveDays) {
      throw buildLeaveError(ERROR_CODES.EXCEEDS_MAX, `Maximum ${policy.maxConsecutiveDays} consecutive days allowed for this leave type.`);
    }

    const pendingLeaves = await Leave.find({
      employee: employee._id,
      leavePolicy: leavePolicyId,
      status: 'Pending',
    }).lean();
    let pendingBusinessDays = 0;
    for (const pl of pendingLeaves) {
      const plStart = toUTCDate(pl.startDate);
      const plEnd = toUTCDate(pl.endDate);
      pendingBusinessDays += getBusinessDays(plStart, plEnd);
    }

    const consumedDays = balance.daysTaken + pendingBusinessDays;
    const remainingDays = balance.totalDays - consumedDays;

    if (remainingDays < requestedDays) {
      throw buildLeaveError(ERROR_CODES.INSUFFICIENT_BALANCE, `Insufficient leave balance. You have ${Math.max(0, remainingDays)} day(s) remaining (including pending requests).`);
    }

    const leaveRequest = await Leave.create({
      employee: employee._id,
      startDate: start,
      endDate: end,
      reason,
      leavePolicy: leavePolicyId,
      attachments: attachments || [],
    });

    await createAuditLog({
      actor: employee._id, action: 'LEAVE_APPLIED',
      target: { id: leaveRequest._id, type: 'Leave' },
      details: { cycleName: policy.name, startDate: start, endDate: end, days: requestedDays },
      ipAddress: req?.ip,
    });

    try {
      if (employee.manager) {
        await createNotification({
          recipient: employee.manager,
          sender: employee._id,
          message: `${employee.name} has submitted a new leave request (${policy.name}, ${requestedDays} day(s)).`,
          link: '/team',
          type: 'Leave',
        }, req);
      }
    } catch (notifErr) {
      logger.error('[LeaveService] Failed to notify manager for leave application:', notifErr);
    }

    return leaveRequest;
};

const getMyLeaveHistory = async (employeeId, { page, limit, status, startDate, endDate } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { employee: employeeId };
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = toUTCDate(startDate);
      if (endDate) query.startDate.$lte = toUTCDate(endDate);
    }
    const [leaveHistory, total] = await Promise.all([
        Leave.find(query)
            .populate('leavePolicy', 'name')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .lean()
            .skip(skip)
            .limit(l),
        Leave.countDocuments(query),
    ]);
    return { data: leaveHistory, pagination: buildPagination(total, p, l) };
};

const withdrawLeaveRequest = async (leaveId, employee, req) => {
    const leaveRequest = await Leave.findById(leaveId);
    if (!leaveRequest) throw buildLeaveError(ERROR_CODES.NOT_FOUND, 'Leave request not found.');
    if (leaveRequest.employee.toString() !== employee._id.toString()) {
      throw buildLeaveError(ERROR_CODES.UNAUTHORIZED, 'You are not authorized to withdraw this request.');
    }
    if (leaveRequest.status !== 'Pending') {
      throw buildLeaveError(null, `Cannot withdraw a request that has already been ${leaveRequest.status.toLowerCase()}.`);
    }

    leaveRequest.status = 'Withdrawn';
    await leaveRequest.save();

    await createAuditLog({
      actor: employee._id, action: 'LEAVE_WITHDRAWN',
      target: { id: leaveRequest._id, type: 'Leave' },
      details: {},
      ipAddress: req?.ip,
    });

    try {
      if (employee.manager) {
        await createNotification({
          recipient: employee.manager,
          sender: employee._id,
          message: `${employee.name} has withdrawn their leave request.`,
          link: '/team',
          type: 'Leave',
        }, req);
      }
    } catch (notifErr) {
      logger.error('[LeaveService] Failed to notify manager for leave withdrawal:', notifErr);
    }

    return leaveRequest;
};

const getTeamLeaves = async (managerId, { page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const teamIds = await getDescendantIds(managerId);
    if (teamIds.length === 0) return { data: [], pagination: buildPagination(0, p, l) };

    const query = { employee: { $in: teamIds } };
    if (status) query.status = status;

    const [leaves, total] = await Promise.all([
        Leave.find(query)
            .populate('employee', 'name')
            .populate('leavePolicy', 'name')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
        Leave.countDocuments(query),
    ]);
    return { data: leaves, pagination: buildPagination(total, p, l) };
};

const reviewLeaveRequest = async (leaveId, managerId, action, managerNotes, req) => {
    const leaveRequest = await Leave.findById(leaveId).populate('employee', 'name manager _id');
    if (!leaveRequest) throw buildLeaveError(ERROR_CODES.NOT_FOUND, 'Leave request not found.');
    if (leaveRequest.status !== 'Pending') {
      throw buildLeaveError(null, `Leave request has already been ${leaveRequest.status.toLowerCase()}.`);
    }

    const employee = leaveRequest.employee;
    if (!employee.manager || employee.manager.toString() !== managerId.toString()) {
      throw buildLeaveError(ERROR_CODES.UNAUTHORIZED, 'You are not authorized to review this leave request.');
    }

    if (action === 'Approved') {
      const start = toUTCDate(leaveRequest.startDate);
      const end = toUTCDate(leaveRequest.endDate);
      const days = getBusinessDays(start, end);
      const startYear = start.getUTCFullYear();
      const endYear = end.getUTCFullYear();

      const balances = await LeaveBalance.find({
        employee: leaveRequest.employee,
        leavePolicy: leaveRequest.leavePolicy,
        year: { $in: [startYear, endYear] },
      });
      const startBalance = balances.find(b => b.year === startYear);
      if (startBalance) {
        startBalance.daysTaken = (startBalance.daysTaken || 0) + days;
        await startBalance.save();
      }
    }

    leaveRequest.status = action;
    leaveRequest.approvedBy = managerId;
    if (managerNotes) leaveRequest.managerNotes = managerNotes;
    await leaveRequest.save();

    await createAuditLog({
      actor: managerId, action: `LEAVE_${action.toUpperCase()}`,
      target: { id: leaveRequest._id, type: 'Leave' },
      details: { managerNotes },
      ipAddress: req?.ip,
    });

    try {
      await createNotification({
        recipient: leaveRequest.employee,
        sender: managerId,
        message: `Your leave request has been ${action.toLowerCase()}.`,
        link: '/my-leaves',
        type: 'Leave',
      }, req);
    } catch (notifErr) {
      logger.error('[LeaveService] Failed to notify employee for leave review:', notifErr);
    }

    return leaveRequest;
};

const getAllLeaves = async ({ page, limit, status, leavePolicyId, startDate, endDate } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (status) query.status = status;
    if (leavePolicyId) query.leavePolicy = leavePolicyId;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = toUTCDate(startDate);
      if (endDate) query.startDate.$lte = toUTCDate(endDate);
    }

    const [leaves, total] = await Promise.all([
        Leave.find(query)
            .populate('employee', 'name')
            .populate('leavePolicy', 'name')
            .populate('approvedBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
        Leave.countDocuments(query),
    ]);
    return { data: leaves, pagination: buildPagination(total, p, l) };
};

const getLeaveSummary = async (employeeId) => {
    const currentYear = new Date().getFullYear();
    const balances = await LeaveBalance.find({ employee: employeeId, year: currentYear })
        .populate('leavePolicy', 'name')
        .lean();

    const leaves = await Leave.find({
        employee: employeeId,
        createdAt: { $gte: new Date(`${currentYear}-01-01`) },
    }).populate('leavePolicy', 'name').lean();

    const summary = balances.map(b => {
        const policyLeaves = leaves.filter(l => l.leavePolicy?._id?.toString() === b.leavePolicy?._id?.toString());
        return {
            policyName: b.leavePolicy?.name || 'Unknown',
            totalDays: b.totalDays,
            daysTaken: b.daysTaken,
            remaining: b.totalDays - b.daysTaken,
            pending: policyLeaves.filter(l => l.status === 'Pending').length,
            approved: policyLeaves.filter(l => l.status === 'Approved').length,
        };
    });

    return {
        year: currentYear,
        balances: summary,
        totalTaken: balances.reduce((s, b) => s + b.daysTaken, 0),
        totalRemaining: balances.reduce((s, b) => s + (b.totalDays - b.daysTaken), 0),
    };
};

const exportLeavesCSV = async (filter = {}) => {
    const leaves = await Leave.find(filter)
        .populate('employee', 'name email')
        .populate('leavePolicy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Employee,Email,Leave Type,Start Date,End Date,Status,Approved By,Manager Notes,Created At\n';
    const rows = leaves.map(l =>
        `"${l.employee?.name || ''}","${l.employee?.email || ''}","${l.leavePolicy?.name || ''}",${l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : ''},${l.endDate ? new Date(l.endDate).toISOString().split('T')[0] : ''},${l.status},"${l.approvedBy?.name || ''}","${(l.managerNotes || '').replace(/"/g, '""')}",${new Date(l.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    applyForLeave, getMyLeaveHistory, withdrawLeaveRequest, getTeamLeaves,
    reviewLeaveRequest, getAllLeaves, getLeaveSummary, exportLeavesCSV, ERROR_CODES,
};
