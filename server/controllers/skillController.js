const { getAllSkills, createSkill, updateSkill, archiveSkill } = require('../services/skillService');

exports.getAllSkills = async (req, res, next) => {
    try {
        const skills = await getAllSkills(req.user.role);
        res.status(200).json({ success: true, data: skills });
    } catch (error) { next(error); }
};

exports.createSkill = async (req, res, next) => {
    try {
        const skill = await createSkill(req.body, req.user.id);
        res.status(201).json({ success: true, data: skill });
    } catch (error) { next(error); }
};

exports.updateSkill = async (req, res, next) => {
    try {
        const skill = await updateSkill(req.params.id, req.body);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        res.status(200).json({ success: true, data: skill });
    } catch (error) { next(error); }
};

exports.archiveSkill = async (req, res, next) => {
    try {
        const skill = await archiveSkill(req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        res.status(200).json({ success: true, message: 'Skill archived successfully' });
    } catch (error) { next(error); }
};
