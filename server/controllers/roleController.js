// In: server/controllers/roleController.js

const Role = require('../model/role.model');
// You might need these in the future, let's keep them
const User = require('../model/user');
const { createAuditLog } = require('../services/auditLogService');
const asyncHandler = require('../utils/asyncHandler');


exports.getAllRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({});
    res.status(200).json({ success: true, data: roles });
});

exports.createRole = asyncHandler(async (req, res) => {
    const role = await Role.create(req.body);
    // Add audit log for creation
    await createAuditLog({
        actor: req.user.id, action: 'ROLE_CREATED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });
    res.status(201).json({ success: true, data: role });
});

exports.updateRole = asyncHandler(async (req, res) => {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }
    
    await createAuditLog({
        actor: req.user.id, action: 'ROLE_UPDATED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });
    res.status(200).json({ success: true, data: role });
});

// --- UPDATED: Delete function for Roles ---
exports.deleteRole = asyncHandler(async (req, res) => {
    const role = await Role.findById(req.params.id);
    if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }

    const usersWithRole = await User.countDocuments({ roles: role._id });
    if (usersWithRole > 0) {
        return res.status(400).json({
            success: false,
            message: `Cannot delete role. It is currently assigned to ${usersWithRole} user(s).`
        });
    }

    await role.deleteOne();

    await createAuditLog({
        actor: req.user.id, action: 'ROLE_DELETED',
        target: { id: role._id, type: 'Role' },
        details: { name: role.name }
    });

    res.status(200).json({ success: true, message: 'Role deleted' });
});