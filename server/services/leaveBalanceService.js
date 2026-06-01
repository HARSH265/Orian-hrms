const LeaveBalance = require('../model/leaveBalance.model');
const LeavePolicy = require('../model/leavePolicy.model');
const logger = require('../utils/logger');

const getMyBalances = async (employeeId) => {
    const currentYear = new Date().getFullYear();
    const balances = await LeaveBalance.find({ employee: employeeId, year: currentYear })
        .populate('leavePolicy', 'name')
        .lean();
    return balances;
};

const assignPolicyToEmployee = async ({ employeeId, leavePolicyId, year }) => {
    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
        throw new Error(`Cannot assign policies for a past year (${year}).`);
    }

    const existingBalance = await LeaveBalance.findOne({
        employee: employeeId,
        leavePolicy: leavePolicyId,
        year: year
    });

    if (existingBalance) {
        throw new Error('ALREADY_EXISTS');
    }

    const policy = await LeavePolicy.findById(leavePolicyId).lean();
    if (!policy) {
        throw new Error('NOT_FOUND');
    }

    const newBalance = await LeaveBalance.create({
        employee: employeeId,
        leavePolicy: leavePolicyId,
        year: year,
        totalDays: policy.daysPerYear,
        daysTaken: 0
    });

    const populatedBalance = await LeaveBalance.findById(newBalance._id)
        .populate('leavePolicy', 'name')
        .lean();

    return populatedBalance;
};

module.exports = { getMyBalances, assignPolicyToEmployee };
