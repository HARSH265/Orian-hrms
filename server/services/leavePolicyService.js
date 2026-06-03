const LeavePolicy = require('../model/leavePolicy.model');
const LeaveBalance = require('../model/leaveBalance.model');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllLeavePolicies = async ({ page, limit, includeArchived } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = includeArchived ? {} : { isArchived: false };
    const [policies, total] = await Promise.all([
        LeavePolicy.find(query)
            .sort({ name: 1 })
            .lean()
            .skip(skip)
            .limit(l),
        LeavePolicy.countDocuments(query)
    ]);
    return { data: policies, pagination: buildPagination(total, p, l) };
};

const createLeavePolicy = async (policyData, userId) => {
    const policy = await LeavePolicy.create(policyData);
    await createAuditLog({
        actor: userId, action: 'LEAVE_POLICY_CREATED',
        target: { id: policy._id, type: 'LeavePolicy' },
        details: { name: policy.name, daysPerYear: policy.daysPerYear },
    });
    return policy;
};

const updateLeavePolicy = async (id, updateData, userId) => {
    const existingPolicy = await LeavePolicy.findById(id).lean();
    if (!existingPolicy) return null;

    const policy = await LeavePolicy.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    }).lean();

    if (updateData.daysPerYear !== undefined && updateData.daysPerYear !== existingPolicy.daysPerYear) {
      const currentYear = new Date().getFullYear();
      await LeaveBalance.updateMany(
        { leavePolicy: id, year: { $gte: currentYear } },
        { $set: { totalDays: updateData.daysPerYear } }
      );
      logger.info(`[LeavePolicy] Updated ${existingPolicy.name} daysPerYear from ${existingPolicy.daysPerYear} to ${updateData.daysPerYear}. Balances recalibrated.`);
    }

    await createAuditLog({
        actor: userId, action: 'LEAVE_POLICY_UPDATED',
        target: { id: policy._id, type: 'LeavePolicy' },
        details: { name: policy.name, changes: updateData },
    });

    return policy;
};

const archiveLeavePolicy = async (id, userId) => {
    const currentYear = new Date().getFullYear();
    const hasBalances = await LeaveBalance.countDocuments({
      leavePolicy: id,
      year: currentYear,
    });

    if (hasBalances > 0) {
      const err = new Error('Cannot archive a policy that has active leave balances for the current year.');
      err.code = 'ACTIVE_BALANCES';
      throw err;
    }

    const policy = await LeavePolicy.findByIdAndUpdate(id, { isArchived: true }, { new: true }).lean();

    await createAuditLog({
        actor: userId, action: 'LEAVE_POLICY_ARCHIVED',
        target: { id: policy._id, type: 'LeavePolicy' },
        details: { name: policy.name },
    });

    return policy;
};

const unarchiveLeavePolicy = async (id, userId) => {
    const policy = await LeavePolicy.findByIdAndUpdate(id, { isArchived: false }, { new: true }).lean();
    if (!policy) return null;

    await createAuditLog({
        actor: userId, action: 'LEAVE_POLICY_UNARCHIVED',
        target: { id: policy._id, type: 'LeavePolicy' },
        details: { name: policy.name },
    });

    return policy;
};

module.exports = {
    getAllLeavePolicies, createLeavePolicy, updateLeavePolicy, archiveLeavePolicy, unarchiveLeavePolicy,
};
