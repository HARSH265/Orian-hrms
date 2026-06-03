const { getAllRoles, getRoleById, createRole, cloneRole, updateRole, deleteRole } = require('../services/roleService');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllRoles = asyncHandler(async (req, res) => {
    const { page, limit, search } = req.query;
    const result = await getAllRoles({ page, limit, search });
    res.status(200).json({ success: true, ...result });
});

exports.getRoleById = asyncHandler(async (req, res) => {
    const role = await getRoleById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, data: role });
});

exports.createRole = asyncHandler(async (req, res) => {
    const role = await createRole(req.body, req.user.id);
    res.status(201).json({ success: true, data: role });
});

exports.cloneRole = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const role = await cloneRole(req.params.id, name, req.user.id);
    res.status(201).json({ success: true, data: role });
});

exports.updateRole = asyncHandler(async (req, res) => {
    const role = await updateRole(req.params.id, req.body, req.user.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });
    res.status(200).json({ success: true, data: role });
});

exports.deleteRole = asyncHandler(async (req, res) => {
    const result = await deleteRole(req.params.id, req.user.id);
    if (result.error === 'not_found') {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }
    if (result.error === 'system_role') {
        return res.status(403).json({ success: false, message: 'System roles cannot be deleted.' });
    }
    if (result.error === 'in_use') {
        return res.status(400).json({
            success: false,
            message: `Cannot delete role. It is currently assigned to ${result.count} user(s).`,
        });
    }
    res.status(200).json({ success: true, message: 'Role deleted' });
});
