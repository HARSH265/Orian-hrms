const Skill = require('../model/skill.model');
const logger = require('../utils/logger');

const getAllSkills = async (userRole) => {
    const query = (userRole === 'hr' || userRole === 'super-admin') ? {} : { isArchived: false };
    const skills = await Skill.find(query).sort({ category: 1, name: 1 }).lean();
    return skills;
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
    const updated = await Skill.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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
