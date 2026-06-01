const SensitiveData = require('../model/sensitiveData.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const getSensitiveData = async (userId, actorId, ip) => {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
        return { error: 'not_found' };
    }

    let sensitiveData = await SensitiveData.findOne({ user: userId }).lean();
    if (!sensitiveData) {
        sensitiveData = { salary: null, bankInfo: {}, nationalId: '' };
    }

    await createAuditLog({
        actor: actorId,
        action: 'SENSITIVE_DATA_VIEWED',
        ipAddress: ip,
        target: { id: targetUser._id, type: 'User' },
        details: `Viewed sensitive data for user: ${targetUser.email}`
    });

    return { sensitiveData, targetUser };
};

const updateSensitiveData = async (userId, updateFields, actorId, ip) => {
    const targetUser = await User.findById(userId);
    if (!targetUser) {
        return { error: 'not_found' };
    }

    const { salary, bankInfo, nationalId } = updateFields;
    const updateData = { salary, bankInfo, nationalId, user: userId };

    const oldData = await SensitiveData.findOne({ user: userId }).lean();

    const newData = await SensitiveData.findOneAndUpdate(
        { user: userId },
        updateData,
        { new: true, upsert: true, runValidators: true }
    );

    const changes = {};
    if (oldData?.salary !== newData.salary) changes.salary = { from: oldData?.salary, to: newData.salary };
    if (oldData?.nationalId !== newData.nationalId) changes.nationalId = 'updated';
    if (JSON.stringify(oldData?.bankInfo) !== JSON.stringify(newData.bankInfo)) changes.bankInfo = 'updated';

    await createAuditLog({
        actor: actorId,
        action: 'SENSITIVE_DATA_UPDATED',
        ipAddress: ip,
        target: { id: targetUser._id, type: 'User' },
        details: {
            message: `Updated sensitive data for user: ${targetUser.email}`,
            changes: changes
        }
    });

    return { newData };
};

module.exports = { getSensitiveData, updateSensitiveData };
