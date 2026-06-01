// controllers/userController.js
const User = require('../model/user');
const ChecklistInstance = require('../model/checklistInstance.model');
const { checklistService, auditLogService } = require('../services');
const Settings = require('../model/Settings');
const userService = require('../services/userService');
const logger = require('../utils/logger');

const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, data: user });
});

// @desc    Update current user's self-service profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateProfile(req);
    res.status(200).json({ success: true, data: updatedUser });
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req);
    res.status(200).json({ success: true, data: user });
});


// We should also add a dedicated getUserById for admins that does the same
// @desc    Get a single user by ID (for Admins)
// @route   GET /api/users/:id
exports.getUserById = asyncHandler(async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all users (for admins)
// @route   GET /api/users
// @access  Private/Admin
// Make sure your getAllUsers function looks like this
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    try {
        const { users, total, page, limit } = await userService.getAllUsers(req.query);
        res.status(200).json({
            success: true,
            count: users.length,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: users
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Update a user's details (by Admin)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */

exports.updateUserById = asyncHandler(async (req, res, next) => {
    try {
        const updatedUser = await userService.updateUser(req.params.id, req.body, req.user.id, req.ip);
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        next(error);
    }
});

/**
 * @desc    Deactivate a user (soft delete)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deactivateUser = asyncHandler(async (req, res, next) => {
    try {
        const userId = req.params.id;
        const userToDeactivate = await User.findById(userId);
        if (!userToDeactivate) {
            return res.status(404).json({ success: false, message: `User not found` });
        }

        // --- THE AUTOMATION LOGIC ---
        const settings = await Settings.findOne({ singleton: 'main_settings' });
        if (settings && settings.offboardingTemplateId) {
            logger.info(`Offboarding checklist found (${settings.offboardingTemplateId}). Applying to user ${userToDeactivate.name}...`);
            await checklistService.applyChecklist({
                templateId: settings.offboardingTemplateId,
                targetUserId: userId,
                creator: req.user,
                startDate: new Date(),
                req
            });
            await auditLogService.createAuditLog({
                actor: req.user.id,
                action: 'OFFBOARDING_INITIATED',
                target: { id: userId, type: 'User' },
                details: { templateId: settings.offboardingTemplateId }
            });
        } else {
            logger.info("No default offboarding checklist configured in settings. Skipping automation.");
        }

        // Use service to deactivate (sets isActive, logs audit)
        await userService.deactivateUser(userId, req.user.id, req.ip);

        res.status(200).json({
            success: true,
            message: 'User deactivated successfully. Offboarding process initiated.',
            data: { deactivatedUserId: userId }
        });
    } catch (error) {
        next(error);
    }
});


/**
 * @desc    Get all users with a manager-level role
 * @route   GET /api/users/managers
 * @access  Private/Admin
 */
exports.getManagerUsers = asyncHandler(async (req, res) => {
    const managers = await userService.getManagerUsers();
    res.status(200).json({ success: true, data: managers });
});
/**
 * @desc    Mark the welcome wizard as complete for the logged-in user
 * @route   PUT /api/users/complete-wizard
 * @access  Private
 */
exports.completeWelcomeWizard = asyncHandler(async (req, res) => {
    const result = await userService.completeWelcomeWizard(req);
    res.status(200).json({ success: true, message: result.message });
});

// ... at the end of the file ...

// @desc    Add a skill to the logged-in user's profile
// @route   POST /api/users/profile/skills
exports.addSkillToProfile = asyncHandler(async (req, res, next) => {
    try {
        const { skillId, proficiency } = req.body;
        const user = await User.findById(req.user.id);
        // Check if the user already has this skill
        if (user.skills.some(s => s.skill.toString() === skillId)) {
            return res.status(400).json({ success: false, message: 'You already have this skill on your profile.' });
        }
        user.skills.push({ skill: skillId, proficiency: proficiency });
        await user.save();
        res.status(200).json({ success: true, data: user.skills });
    } catch (error) { next(error); }
});

// @desc    Remove a skill from the logged-in user's profile
// @route   DELETE /api/users/profile/skills/:skillId
exports.removeSkillFromProfile = asyncHandler(async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        user.skills = user.skills.filter(s => s.skill.toString() !== req.params.skillId);
        await user.save();
        res.status(200).json({ success: true, data: user.skills });
    } catch (error) { next(error); }
});

// @desc    Endorse a skill for another user
// @route   POST /api/users/:userId/skills/:skillId/endorse
exports.endorseSkill = asyncHandler(async (req, res) => {
    const skills = await userService.endorseSkill(req);
    res.status(200).json({ success: true, data: skills });
});

// @desc    Get all checklist instances for a specific user
// @route   GET /api/users/:id/checklist-instances
// @access  Private (Manager, HR, Admin)
exports.getUserChecklistInstances = asyncHandler(async (req, res) => {
    const instances = await userService.getUserChecklistInstances(req);
    res.status(200).json({ success: true, data: instances });
});