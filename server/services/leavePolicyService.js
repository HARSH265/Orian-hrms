const LeavePolicy = require('../model/leavePolicy.model');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllLeavePolicies = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { isArchived: false };
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

const createLeavePolicy = async (policyData) => {
    const policy = await LeavePolicy.create(policyData);
    return policy;
};

const updateLeavePolicy = async (id, updateData) => {
    const policy = await LeavePolicy.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    }).lean();
    return policy;
};

const archiveLeavePolicy = async (id) => {
    const policy = await LeavePolicy.findByIdAndUpdate(
        id,
        { isArchived: true },
        { new: true }
    ).lean();
    return policy;
};

module.exports = {
    getAllLeavePolicies,
    createLeavePolicy,
    updateLeavePolicy,
    archiveLeavePolicy
};
