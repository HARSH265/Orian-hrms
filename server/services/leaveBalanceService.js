const LeaveBalance = require('../model/leaveBalance.model');
const LeavePolicy = require('../model/leavePolicy.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');

const getMyBalances = async (employeeId, year) => {
    const targetYear = year || new Date().getFullYear();
    const balances = await LeaveBalance.find({ employee: employeeId, year: targetYear })
        .populate('leavePolicy', 'name')
        .lean();
    return balances;
};

const getAdminBalances = async ({ policyId, year, departmentId } = {}) => {
    const targetYear = year || new Date().getFullYear();
    const query = { year: targetYear };
    if (policyId) query.leavePolicy = policyId;
    if (departmentId) {
        const users = await User.find({ department: departmentId, isActive: true }).select('_id').lean();
        query.employee = { $in: users.map(u => u._id) };
    }
    const balances = await LeaveBalance.find(query)
        .populate('leavePolicy', 'name')
        .populate('employee', 'name email')
        .sort({ 'employee.name': 1 })
        .lean();
    return balances;
};

const assignPolicyToEmployee = async ({ employeeId, leavePolicyId, year }) => {
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
        throw new Error('Cannot assign policies for a past year.');
    }
    if (year > currentYear + 5) {
        throw new Error('Cannot assign policies for a year more than 5 years in the future.');
    }

    const existing = await LeaveBalance.findOne({ employee: employeeId, leavePolicy: leavePolicyId, year });
    if (existing) throw new Error('ALREADY_EXISTS');

    const policy = await LeavePolicy.findById(leavePolicyId).lean();
    if (!policy) throw new Error('NOT_FOUND');

    const newBalance = await LeaveBalance.create({
        employee: employeeId, leavePolicy: leavePolicyId, year,
        totalDays: policy.daysPerYear, daysTaken: 0,
    });

    return LeaveBalance.findById(newBalance._id).populate('leavePolicy', 'name').lean();
};

const bulkAssignPolicy = async ({ leavePolicyId, year, employeeIds, departmentId, userId }) => {
    let ids = employeeIds;
    if (departmentId && !ids) {
        const users = await User.find({ department: departmentId, isActive: true }).select('_id').lean();
        ids = users.map(u => u._id);
    }
    if (!ids || ids.length === 0) throw new Error('No employees specified.');

    const policy = await LeavePolicy.findById(leavePolicyId).lean();
    if (!policy) throw new Error('NOT_FOUND');

    const existing = await LeaveBalance.find({ leavePolicy: leavePolicyId, year }).lean();
    const existingSet = new Set(existing.map(e => e.employee.toString()));

    const toCreate = ids.filter(id => !existingSet.has(id.toString())).map(id => ({
        employee: id, leavePolicy: leavePolicyId, year,
        totalDays: policy.daysPerYear, daysTaken: 0,
    }));

    if (toCreate.length > 0) {
        await LeaveBalance.insertMany(toCreate);
    }

    await createAuditLog({
        actor: userId, action: 'LEAVE_POLICY_BULK_ASSIGNED',
        target: { id: leavePolicyId, type: 'LeavePolicy' },
        details: { year, employeeCount: toCreate.length, totalTargeted: ids.length },
    });

    return { assigned: toCreate.length, skipped: ids.length - toCreate.length };
};

module.exports = { getMyBalances, getAdminBalances, assignPolicyToEmployee, bulkAssignPolicy };
