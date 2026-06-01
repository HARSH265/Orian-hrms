const LeavePolicy = require('../model/leavePolicy.model');
const logger = require('../utils/logger');

const getAllLeavePolicies = async () => {
    const policies = await LeavePolicy.find({ isArchived: false })
        .sort({ name: 1 })
        .lean();
    return policies;
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
