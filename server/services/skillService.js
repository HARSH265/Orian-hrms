const Skill = require('../model/skill.model');
const { createAuditLog } = require('./auditLogService');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllSkills = async (userSystemRole, { page, limit, category } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = (userSystemRole === 'hr' || userSystemRole === 'super-admin') ? {} : { isArchived: false };
    if (category) query.category = category;
    const [skills, total] = await Promise.all([
        Skill.find(query).sort({ category: 1, name: 1 }).lean().skip(skip).limit(l),
        Skill.countDocuments(query),
    ]);
    return { data: skills, pagination: buildPagination(total, p, l) };
};

const getSkillById = async (id) => {
    const skill = await Skill.findById(id).lean();
    if (!skill) {
        const err = new Error('Skill not found.');
        err.status = 404;
        throw err;
    }
    return skill;
};

const createSkill = async (skillData, userId, ip) => {
    const existing = await Skill.findOne({ name: skillData.name });
    if (existing) {
        const err = new Error('A skill with this name already exists.');
        err.status = 409;
        throw err;
    }
    skillData.createdBy = userId;
    const skill = await Skill.create(skillData);
    await createAuditLog({
        actor: userId, action: 'SKILL_CREATED',
        target: { id: skill._id, type: 'Skill' },
        details: { name: skill.name, category: skill.category },
        ipAddress: ip,
    });
    return skill;
};

const updateSkill = async (id, updateData, userId, ip) => {
    const allowedFields = ['name', 'category'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) filteredUpdates[field] = updateData[field];
    });
    const updated = await Skill.findByIdAndUpdate(id, filteredUpdates, { new: true, runValidators: true });
    if (!updated) {
        const err = new Error('Skill not found.');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'SKILL_UPDATED',
        target: { id, type: 'Skill' },
        details: { updates: filteredUpdates },
        ipAddress: ip,
    });
    return updated;
};

const archiveSkill = async (id, userId, ip) => {
    const skill = await Skill.findById(id);
    if (!skill) {
        const err = new Error('Skill not found.');
        err.status = 404;
        throw err;
    }
    skill.isArchived = true;
    await skill.save();
    await createAuditLog({
        actor: userId, action: 'SKILL_ARCHIVED',
        target: { id, type: 'Skill' },
        details: { name: skill.name },
        ipAddress: ip,
    });
    return skill;
};

const exportSkillsCSV = async (filter = {}) => {
    const skills = await Skill.find(filter).sort({ category: 1, name: 1 }).lean();
    const header = 'Name,Category,Created At\n';
    const rows = skills.map(s =>
        `"${(s.name || '').replace(/"/g, '""')}","${(s.category || '').replace(/"/g, '""')}",${new Date(s.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    getAllSkills, getSkillById, createSkill, updateSkill, archiveSkill, exportSkillsCSV,
};
