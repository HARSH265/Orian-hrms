const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');

exports.createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data: updatedUser });
});

exports.getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: user });
});

exports.getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
    const { users, total, page, limit } = await userService.getAllUsers(req.query);
    res.status(200).json({
        success: true, count: users.length,
        pagination: { total, page, pages: Math.ceil(total / limit) },
        data: users,
    });
});

exports.updateUserById = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ success: true, data: updatedUser });
});

exports.reactivateUser = asyncHandler(async (req, res) => {
    const user = await userService.reactivateUser(req.params.id, req.user.id, req.ip);
    res.json({ success: true, data: user });
});

exports.exportUsers = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.systemRole) filter.systemRole = req.query.systemRole;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    const csv = await userService.exportUsersCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.csv"');
    res.send(csv);
});

exports.deactivateUser = asyncHandler(async (req, res) => {
    const result = await userService.deactivateUser(req.params.id, req.user, req.ip);
    res.status(200).json({ success: true, ...result });
});

exports.getManagerUsers = asyncHandler(async (req, res) => {
    const managers = await userService.getManagerUsers();
    res.status(200).json({ success: true, data: managers });
});

exports.completeWelcomeWizard = asyncHandler(async (req, res) => {
    const result = await userService.completeWelcomeWizard(req.user.id);
    res.status(200).json({ success: true, message: result.message });
});

exports.addSkillToProfile = asyncHandler(async (req, res) => {
    const { skillId, proficiency } = req.body;
    const skills = await userService.addSkill(req.user.id, skillId, proficiency);
    res.status(200).json({ success: true, data: skills });
});

exports.removeSkillFromProfile = asyncHandler(async (req, res) => {
    const skills = await userService.removeSkill(req.user.id, req.params.skillId);
    res.status(200).json({ success: true, data: skills });
});

exports.endorseSkill = asyncHandler(async (req, res) => {
    const skills = await userService.endorseSkill(req.params.userId, req.params.skillId, req.user.id);
    res.status(200).json({ success: true, data: skills });
});

exports.getUserChecklistInstances = asyncHandler(async (req, res) => {
    const instances = await userService.getUserChecklistInstances(req.params.id, req.user.id, req.user.systemRole);
    res.status(200).json({ success: true, data: instances });
});
