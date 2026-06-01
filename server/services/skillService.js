const Skill = require('../model/skill.model');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getAllSkills = async (userRole, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = (userRole === 'hr' || userRole === 'super-admin') ? {} : { isArchived: false };
    const [skills, total] = await Promise.all([
        Skill.find(query).sort({ category: 1, name: 1 }).lean().skip(skip).limit(l),
        Skill.countDocuments(query)
    ]);
    return { data: skills, pagination: buildPagination(total, p, l) };
};

const createSkill = async (skillData, userId) => {
    skillData.createdBy = userId;
    const skill = await Skill.create(skillData);
    return skill;
};

const updateSkill = async (id, updateData) => {
    const skill = await Skill.findById(id);
    if (!skill) {
        return null;
    }
    // Whitelist allowed fields
    const allowedFields = ['name', 'category'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
            filteredUpdates[field] = updateData[field];
        }
    });
    const updated = await Skill.findByIdAndUpdate(id, filteredUpdates, { new: true, runValidators: true });
    return updated;
};

const archiveSkill = async (id) => {
    const skill = await Skill.findById(id);
    if (!skill) {
        return null;
    }
    skill.isArchived = true;
    await skill.save();
    return skill;
};

module.exports = { getAllSkills, createSkill, updateSkill, archiveSkill };
