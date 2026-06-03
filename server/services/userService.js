const User = require('../model/user');
const Settings = require('../model/Settings');
const ChecklistInstance = require('../model/checklistInstance.model');
const { checklistService, auditLogService } = require('./index');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const createUser = async (payload, actorId, ip) => {
    const { name, email, password, systemRole, jobTitle, department, manager, roles, employmentInfo, personalInfo } = payload;
    const existing = await User.findOne({ email });
    if (existing) throw new Error('User already exists');
    const user = await User.create({
        name, email, password, systemRole, roles, jobTitle, department, manager, employmentInfo, personalInfo,
    });
    await createAuditLog({
        actor: actorId, action: 'USER_CREATED',
        target: { id: user._id, type: 'User' },
        details: { name: user.name, email: user.email, systemRole: user.systemRole },
        ipAddress: ip,
    });
    return user;
};

const getUserById = async (userId) => {
    return User.findById(userId)
        .populate('department', 'name')
        .populate('manager', 'name')
        .populate({ path: 'employmentHistory', populate: [{ path: 'department', select: 'name' }, { path: 'manager', select: 'name' }] })
        .populate({ path: 'skills.skill', model: 'Skill', select: 'name' })
        .lean();
};

const getAllUsers = async (filter = {}) => {
    const { systemRole, status, search, sortBy = 'name', order = 'asc', page = 1, limit: rawLimit = 10 } = filter;
    const limit = Math.min(Math.max(parseInt(rawLimit) || 10, 1), 100);
    const query = {};
    if (systemRole) query.systemRole = systemRole;
    if (status !== undefined) query.isActive = status === 'active';
    if (search) {
        const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [{ name: { $regex: escapedSearch, $options: 'i' } }, { email: { $regex: escapedSearch, $options: 'i' } }];
    }
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

const updateUser = async (userId, updates, actorId, ip) => {
    const userBefore = await User.findById(userId).lean();
    if (!userBefore) throw new Error('User not found');
    const allowedFields = [
        'name', 'jobTitle', 'department', 'manager', 'phone', 'address',
        'employmentInfo', 'personalInfo', 'emergencyContact', 'roles', 'systemRole',
    ];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
    });
    delete filteredUpdates.password;
    delete filteredUpdates.twoFactorAuth;
    delete filteredUpdates.isActive;
    delete filteredUpdates.failedLoginAttempts;
    delete filteredUpdates.lockUntil;

    if (filteredUpdates.manager) {
        let currentManagerId = filteredUpdates.manager.toString();
        const visited = new Set([userId.toString()]);
        while (currentManagerId) {
            if (visited.has(currentManagerId)) throw new Error('Circular manager relationship detected');
            visited.add(currentManagerId);
            const managerUser = await User.findById(currentManagerId).select('manager').lean();
            currentManagerId = managerUser?.manager?.toString();
        }
    }
    const updated = await User.findByIdAndUpdate(userId, filteredUpdates, { new: true, runValidators: true });
    await createAuditLog({
        actor: actorId, action: 'USER_UPDATED',
        target: { id: userId, type: 'User' },
        details: { before: userBefore, after: updates },
        ipAddress: ip,
    });
    return updated;
};

const deactivateUser = async (userId, actor, ip) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const settings = await Settings.findOne({ singleton: 'main_settings' });
    if (settings?.offboardingTemplateId) {
        await checklistService.applyChecklist({
            templateId: settings.offboardingTemplateId,
            targetUserId: userId,
            creator: actor,
            startDate: new Date(),
        });
        await createAuditLog({
            actor: actor._id, action: 'OFFBOARDING_INITIATED',
            target: { id: userId, type: 'User' },
            details: { templateId: settings.offboardingTemplateId },
        });
    }

    user.isActive = false;
    await user.save();
    await createAuditLog({ actor: actor._id, action: 'USER_DEACTIVATED', target: { id: userId, type: 'User' }, ipAddress: ip });
    return { message: 'User deactivated successfully. Offboarding process initiated.', data: { deactivatedUserId: userId } };
};

const reactivateUser = async (userId, actorId, ip) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.isActive) throw new Error('User is already active');
    user.isActive = true;
    await user.save();
    await createAuditLog({ actor: actorId, action: 'USER_REACTIVATED', target: { id: userId, type: 'User' }, ipAddress: ip });
    return user;
};

const addSkill = async (userId, skillId, proficiency) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    if (user.skills.some(s => s.skill.toString() === skillId)) throw new Error('Skill already added');
    user.skills.push({ skill: skillId, proficiency });
    await user.save();
    return user.skills;
};

const removeSkill = async (userId, skillId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    user.skills = user.skills.filter(s => s.skill.toString() !== skillId);
    await user.save();
    return user.skills;
};

const updateProfile = async (userId, updateData) => {
    const user = await User.findById(userId);
    if (!user) { const err = new Error('User not found'); err.status = 404; throw err; }
    const allowedTopLevelFields = ['name', 'phone', 'address', 'profilePictureUrl'];
    allowedTopLevelFields.forEach(field => {
        if (updateData[field] !== undefined) user[field] = updateData[field];
    });
    if (updateData.personalInfo) {
        const allowedPersonalInfoFields = ['dateOfBirth', 'gender', 'nationality', 'maritalStatus'];
        if (!user.personalInfo) user.personalInfo = {};
        allowedPersonalInfoFields.forEach(field => {
            if (updateData.personalInfo[field] !== undefined) user.personalInfo[field] = updateData.personalInfo[field];
        });
    }
    if (updateData.emergencyContact) {
        const allowedEmergencyFields = ['name', 'phone', 'relation'];
        if (!user.emergencyContact) user.emergencyContact = {};
        allowedEmergencyFields.forEach(field => {
            if (updateData.emergencyContact[field] !== undefined) user.emergencyContact[field] = updateData.emergencyContact[field];
        });
    }
    const updatedUser = await user.save();
    return await User.findById(updatedUser._id)
        .populate('department', 'name')
        .populate('manager', 'name')
        .populate({ path: 'employmentHistory', populate: [{ path: 'department', select: 'name' }, { path: 'manager', select: 'name' }] })
        .populate({ path: 'skills.skill', model: 'Skill', select: 'name' });
};

const getProfile = async (userId) => {
    return User.findById(userId)
        .populate('department', 'name')
        .populate('manager', 'name')
        .populate({ path: 'employmentHistory', populate: [{ path: 'department', select: 'name' }, { path: 'manager', select: 'name' }] })
        .populate({ path: 'skills.skill', model: 'Skill', select: 'name' })
        .lean();
};

const getManagerUsers = async () => {
    return User.find({ systemRole: { $in: ['manager', 'hr', 'super-admin'] } }).select('name');
};

const completeWelcomeWizard = async (userId) => {
    await User.findByIdAndUpdate(userId, { needsWelcomeWizard: false });
    return { message: 'Welcome wizard completed.' };
};

const endorseSkill = async (userId, skillId, endorserId) => {
    const userToEndorse = await User.findById(userId);
    if (!userToEndorse) { const err = new Error('User not found'); err.status = 404; throw err; }
    const skillToEndorse = userToEndorse.skills.find(s => s.skill.toString() === skillId);
    if (!skillToEndorse) { const err = new Error('User does not have this skill.'); err.status = 404; throw err; }
    if (skillToEndorse.endorsements.some(e => e.toString() === endorserId) || userId.toString() === endorserId) {
        const err = new Error('Cannot endorse this skill.'); err.status = 400; throw err;
    }
    await User.findByIdAndUpdate(userId, { $addToSet: { 'skills.$[elem].endorsements': endorserId } }, { arrayFilters: [{ 'elem.skill': skillId }] });
    const updatedUser = await User.findById(userId).populate({ path: 'skills.skill skills.endorsements', select: 'name category profilePictureUrl' });
    return updatedUser.skills;
};

const getUserChecklistInstances = async (targetUserId, loggedInUserId, loggedInUserRole) => {
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) { const err = new Error('Target user not found.'); err.status = 404; throw err; }
    const isManager = targetUser.manager?.toString() === loggedInUserId;
    const isAdminOrHr = ['super-admin', 'hr'].includes(loggedInUserRole);
    if (!isManager && !isAdminOrHr) { const err = new Error('You are not authorized to view these checklists.'); err.status = 403; throw err; }
    const instances = await ChecklistInstance.find({ targetUser: targetUserId })
        .populate('template', 'name')
        .populate({ path: 'generatedTasks', select: 'title status assignees', populate: { path: 'assignees', select: 'name profilePictureUrl' } })
        .sort({ createdAt: -1 });
    return instances;
};

const exportUsersCSV = async (filter = {}) => {
    const users = await User.find(filter)
        .populate('department', 'name')
        .populate('manager', 'name')
        .sort({ name: 1 })
        .lean();

    const header = 'Name,Email,Role,Job Title,Department,Manager,Status,Hire Date,Created At\n';
    const rows = users.map(u =>
        `"${u.name || ''}","${u.email || ''}",${u.systemRole || ''},"${u.jobTitle || ''}","${u.department?.name || ''}","${u.manager?.name || ''}",${u.isActive ? 'Active' : 'Inactive'},${u.employmentInfo?.hireDate ? new Date(u.employmentInfo.hireDate).toISOString().split('T')[0] : ''},${new Date(u.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    createUser, getUserById, getAllUsers, updateUser, deactivateUser, reactivateUser,
    addSkill, removeSkill, updateProfile, getProfile, getManagerUsers,
    completeWelcomeWizard, endorseSkill, getUserChecklistInstances, exportUsersCSV,
};
