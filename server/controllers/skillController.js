const asyncHandler = require('../utils/asyncHandler');
const skillService = require('../services/skillService');

exports.getAllSkills = asyncHandler(async (req, res) => {
    const { page, limit, category } = req.query;
    const result = await skillService.getAllSkills(req.user.systemRole, { page, limit, category });
    res.json({ success: true, ...result });
});

exports.getSkillById = asyncHandler(async (req, res, next) => {
    try {
        const skill = await skillService.getSkillById(req.params.id);
        res.json({ success: true, data: skill });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.createSkill = asyncHandler(async (req, res, next) => {
    try {
        const skill = await skillService.createSkill(req.body, req.user.id, req.ip);
        res.status(201).json({ success: true, data: skill });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.updateSkill = asyncHandler(async (req, res, next) => {
    try {
        const skill = await skillService.updateSkill(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: skill });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.archiveSkill = asyncHandler(async (req, res, next) => {
    try {
        await skillService.archiveSkill(req.params.id, req.user.id, req.ip);
        res.json({ success: true, message: 'Skill archived.' });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.exportSkills = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const csv = await skillService.exportSkillsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="skills-export.csv"');
    res.send(csv);
});
