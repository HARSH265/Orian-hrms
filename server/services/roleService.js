const Role = require('../model/role.model');
const User = require('../model/user');
const { createAuditLog } = require('./auditLogService');
const { clearPermissionCache } = require('../middleware/authMiddleware');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllRoles = async ({ page, limit, search } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });

    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const [roles, total] = await Promise.all([
        Role.find(query).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
        Role.countDocuments(query),
    ]);

    const roleIds = roles.map(r => r._id);
    const userCounts = await User.aggregate([
        { $match: { roles: { $in: roleIds } } },
        { $unwind: '$roles' },
        { $group: { _id: '$roles', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const entry of userCounts) {
        countMap[entry._id.toString()] = entry.count;
    }

    const data = roles.map(r => ({ ...r, userCount: countMap[r._id.toString()] || 0 }));
    return { data, pagination: buildPagination(total, p, l) };
};

const getRoleById = async (id) => {
    const role = await Role.findById(id).lean();
    if (!role) return null;
    const userCount = await User.countDocuments({ roles: role._id });
    return { ...role, userCount };
};

const createRole = async (roleData, userId) => {
    try {
        const role = await Role.create(roleData);
        await createAuditLog({
            actor: userId, action: 'ROLE_CREATED',
            target: { id: role._id, type: 'Role' },
            details: { name: role.name, permissions: role.permissions },
        });
        return role;
    } catch (error) {
        if (error.code === 11000) {
            throw Object.assign(new Error(`Role "${roleData.name}" already exists.`), { statusCode: 409 });
        }
        throw error;
    }
};

const cloneRole = async (id, newName, userId) => {
    const source = await Role.findById(id);
    if (!source) throw Object.assign(new Error('Role not found.'), { statusCode: 404 });

    try {
        const role = await Role.create({
            name: newName || `${source.name} (Copy)`,
            description: source.description,
            permissions: source.permissions,
            isSystemRole: false,
        });

        await createAuditLog({
            actor: userId, action: 'ROLE_CLONED',
            target: { id: role._id, type: 'Role' },
            details: { name: role.name, clonedFrom: source.name },
        });
        return role;
    } catch (error) {
        if (error.code === 11000) {
            throw Object.assign(new Error(`Role "${newName || `${source.name} (Copy)`}" already exists.`), { statusCode: 409 });
        }
        throw error;
    }
};

const updateRole = async (id, updateData, userId) => {
    const role = await Role.findById(id);
    if (!role) return null;
    if (role.isSystemRole) {
        throw Object.assign(new Error('System roles cannot be modified.'), { statusCode: 403 });
    }

    const oldPermissions = [...role.permissions];

    Object.assign(role, updateData);
    try {
        await role.save();
    } catch (error) {
        if (error.code === 11000) {
            throw Object.assign(new Error(`Role "${updateData.name}" already exists.`), { statusCode: 409 });
        }
        throw error;
    }

    const added = role.permissions.filter(p => !oldPermissions.includes(p));
    const removed = oldPermissions.filter(p => !role.permissions.includes(p));

    await createAuditLog({
        actor: userId, action: 'ROLE_UPDATED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name, addedPermissions: added, removedPermissions: removed },
    });

    clearPermissionCache();
    return role;
};

const deleteRole = async (id, userId) => {
    const role = await Role.findById(id);
    if (!role) return { error: 'not_found' };
    if (role.isSystemRole) {
        return { error: 'system_role' };
    }

    const usersWithRole = await User.countDocuments({ roles: role._id });
    if (usersWithRole > 0) {
        return { error: 'in_use', count: usersWithRole };
    }

    await role.deleteOne();

    await createAuditLog({
        actor: userId, action: 'ROLE_DELETED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name },
    });

    clearPermissionCache();
    return { success: true };
};

module.exports = { getAllRoles, getRoleById, createRole, cloneRole, updateRole, deleteRole };
