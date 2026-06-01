const User = require('../model/user');
const ChecklistInstance = require('../model/checklistInstance.model');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

/**
 * Create a new user (admin only)
 */
const createUser = async (payload, actorId, ip) => {
    const { name, email, password, systemRole, jobTitle, department, manager, roles, employmentInfo, personalInfo } = payload;
    const existing = await User.findOne({ email });
    if (existing) {
        throw new Error('User already exists');
    }
    const user = await User.create({
        name,
        email,
        password,
        systemRole,
        roles,
        jobTitle,
        department,
        manager,
        employmentInfo,
        personalInfo,
    });
    await createAuditLog({
        actor: actorId,
        action: 'USER_CREATED',
        target: { id: user._id, type: 'User' },
        details: { name: user.name, email: user.email, systemRole: user.systemRole },
        ipAddress: ip,
    });
    return user;
};

/**
 * Get a user by ID (admin or self)
 */
const getUserById = async (userId) => {
    return User.findById(userId)
        .populate('department', 'name')
        .populate('manager', 'name')
        .populate({
            path: 'employmentHistory',
            populate: [
                { path: 'department', select: 'name' },
                { path: 'manager', select: 'name' },
            ],
        })
        .populate({
            path: 'skills.skill',
            model: 'Skill',
            select: 'name',
        })
        .lean();
};

/**
 * Get all users with optional filters & pagination (admin)
 */
const getAllUsers = async (filter = {}, options = {}) => {
    const { role, status, search, sortBy = 'name', order = 'asc', page = 1, limit = 10 } = filter;
    const query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const sortOptions = { [sortBy]: order === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find(query)
            .populate('manager', 'name')
            .populate('department', 'name')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean(),
        User.countDocuments(query),
    ]);
    return { users, total, page, limit };
};

/**
 * Update a user (admin)
 */
const updateUser = async (userId, updates, actorId, ip) => {
    const userBefore = await User.findById(userId).lean();
    if (!userBefore) throw new Error('User not found');
    const updated = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
    await createAuditLog({
        actor: actorId,
        action: 'USER_UPDATED',
        target: { id: userId, type: 'User' },
        details: { before: userBefore, after: updates },
        ipAddress: ip,
    });
    return updated;
};

/**
 * Deactivate (soft‑delete) a user and optionally run off‑boarding checklist.
 */
const deactivateUser = async (userId, actorId, ip) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    // Off‑boarding logic can be added here (omitted for brevity).
    user.isActive = false;
    await user.save();
    await createAuditLog({
        actor: actorId,
        action: 'USER_DEACTIVATED',
        target: { id: userId, type: 'User' },
        ipAddress: ip,
    });
    return user;
};

/**
 * Add a skill to a user's profile.
 */
const addSkill = async (userId, skillId, proficiency) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.skills.some(s => s.skill.toString() === skillId)) {
        throw new Error('Skill already added');
    }
    user.skills.push({ skill: skillId, proficiency });
    await user.save();
    return user.skills;
};

/**
 * Remove a skill from a user's profile.
 */
const removeSkill = async (userId, skillId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    user.skills = user.skills.filter(s => s.skill.toString() !== skillId);
    await user.save();
    return user.skills;
};

module.exports = {
    createUser,
    getUserById,
    getAllUsers,
    updateUser,
    deactivateUser,
    addSkill,
    removeSkill,
    // New service methods added for remaining controller actions
    updateProfile: async (req) => {
        const userId = req.user.id;
        const updateData = req.body;
        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }
        // Allowed top‑level fields
        const allowedTopLevelFields = ['name', 'phone', 'address', 'profilePictureUrl'];
        allowedTopLevelFields.forEach(field => {
            if (updateData[field] !== undefined) {
                user[field] = updateData[field];
            }
        });
        // PersonalInfo
        if (updateData.personalInfo) {
            const allowedPersonalInfoFields = ['dateOfBirth', 'gender', 'nationality', 'maritalStatus'];
            if (!user.personalInfo) user.personalInfo = {};
            allowedPersonalInfoFields.forEach(field => {
                if (updateData.personalInfo[field] !== undefined) {
                    user.personalInfo[field] = updateData.personalInfo[field];
                }
            });
        }
        // EmergencyContact
        if (updateData.emergencyContact) {
            const allowedEmergencyFields = ['name', 'phone', 'relation'];
            if (!user.emergencyContact) user.emergencyContact = {};
            allowedEmergencyFields.forEach(field => {
                if (updateData.emergencyContact[field] !== undefined) {
                    user.emergencyContact[field] = updateData.emergencyContact[field];
                }
            });
        }
        const updatedUser = await user.save();
        // Re‑populate for response
        return await User.findById(updatedUser._id)
            .populate('department', 'name')
            .populate('manager', 'name')
            .populate({
                path: 'employmentHistory',
                populate: [
                    { path: 'department', select: 'name' },
                    { path: 'manager', select: 'name' }
                ]
            })
            .populate({
                path: 'skills.skill',
                model: 'Skill',
                select: 'name'
            });
    },
    getProfile: async (req) => {
        const user = await User.findById(req.user.id)
            .populate('department', 'name')
            .populate('manager', 'name')
            .populate({
                path: 'employmentHistory',
                populate: [
                    { path: 'department', select: 'name' },
                    { path: 'manager', select: 'name' }
                ]
            })
            .populate({
                path: 'skills.skill',
                model: 'Skill',
                select: 'name'
            })
            .lean();
        return user;
    },
    getManagerUsers: async () => {
        return await User.find({ role: { $in: ['manager', 'hr', 'super-admin'] } }).select('name');
    },
    completeWelcomeWizard: async (req) => {
        await User.findByIdAndUpdate(req.user.id, { needsWelcomeWizard: false });
        return { message: 'Welcome wizard completed.' };
    },
    endorseSkill: async (req) => {
        const endorserId = req.user.id;
        const { userId, skillId } = req.params;
        const userToEndorse = await User.findById(userId);
        if (!userToEndorse) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }
        const skillToEndorse = userToEndorse.skills.find(s => s.skill.toString() === skillId);
        if (!skillToEndorse) {
            const err = new Error('User does not have this skill.');
            err.status = 404;
            throw err;
        }
        if (skillToEndorse.endorsements.includes(endorserId) || userId === endorserId) {
            const err = new Error('Cannot endorse this skill.');
            err.status = 400;
            throw err;
        }
        skillToEndorse.endorsements.push(endorserId);
        await userToEndorse.save();
        const updatedUser = await User.findById(userId).populate({
            path: 'skills.skill skills.endorsements',
            select: 'name category profilePictureUrl'
        });
        return updatedUser.skills;
    },
    getUserChecklistInstances: async (req) => {
        const targetUserId = req.params.id;
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            const err = new Error('Target user not found.');
            err.status = 404;
            throw err;
        }
        const isManager = targetUser.manager?.toString() === req.user.id.toString();
        const isAdminOrHr = ['super-admin', 'hr'].includes(req.user.role);
        if (!isManager && !isAdminOrHr) {
            const err = new Error('You are not authorized to view these checklists.');
            err.status = 403;
            throw err;
        }
        const instances = await ChecklistInstance.find({ targetUser: targetUserId })
            .populate('template', 'name')
            .populate({
                path: 'generatedTasks',
                select: 'title status assignees',
                populate: {
                    path: 'assignees',
                    select: 'name profilePictureUrl'
                }
            })
            .sort({ createdAt: -1 });
        return instances;
    }
};
