const { getAllRoles, createRole, updateRole, deleteRole } = require('../services/roleService');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllRoles = asyncHandler(async (req, res) => {
    const roles = await getAllRoles();
    res.status(200).json({ success: true, data: roles });
});

exports.createRole = asyncHandler(async (req, res) => {
    const role = await createRole(req.body, req.user.id);
    res.status(201).json({ success: true, data: role });
});

exports.updateRole = asyncHandler(async (req, res) => {
    const role = await updateRole(req.params.id, req.body, req.user.id);
    if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }
    res.status(200).json({ success: true, data: role });
});

exports.deleteRole = asyncHandler(async (req, res) => {
    const result = await deleteRole(req.params.id, req.user.id);
    if (result.error === 'not_found') {
        return res.status(404).json({ success: false, message: 'Role not found' });
    }
    if (result.error === 'in_use') {
        return res.status(400).json({
            success: false,
            message: `Cannot delete role. It is currently assigned to ${result.count} user(s).`
        });
    }
    res.status(200).json({ success: true, message: 'Role deleted' });
});
