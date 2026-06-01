const Role = require('../model/role.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const getAllRoles = async () => {
    const roles = await Role.find({}).lean();
    return roles;
};

const createRole = async (roleData, userId) => {
    const role = await Role.create(roleData);
    await createAuditLog({
        actor: userId, action: 'ROLE_CREATED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });
    return role;
};

const updateRole = async (id, updateData, userId) => {
    const role = await Role.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    if (!role) {
        return null;
    }

    await createAuditLog({
        actor: userId, action: 'ROLE_UPDATED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });
    return role;
};

const deleteRole = async (id, userId) => {
    const role = await Role.findById(id);
    if (!role) {
        return { error: 'not_found' };
    }

    const usersWithRole = await User.countDocuments({ roles: role._id });
    if (usersWithRole > 0) {
        return { error: 'in_use', count: usersWithRole };
    }

    await role.deleteOne();

    await createAuditLog({
        actor: userId, action: 'ROLE_DELETED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });

    return { success: true };
};

module.exports = { getAllRoles, createRole, updateRole, deleteRole };
