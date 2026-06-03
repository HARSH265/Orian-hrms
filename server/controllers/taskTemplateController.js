const taskTemplateService = require('../services/taskTemplateService');
const asyncHandler = require('../utils/asyncHandler');

exports.getTemplates = asyncHandler(async (req, res) => {
    const templates = await taskTemplateService.getTemplates(req.query);
    res.status(200).json({ success: true, data: templates });
});

exports.getTemplateById = asyncHandler(async (req, res) => {
    const template = await taskTemplateService.getTemplateById(req.params.id);
    res.status(200).json({ success: true, data: template });
});

exports.createTemplate = asyncHandler(async (req, res) => {
    const template = await taskTemplateService.createTemplate(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, data: template });
});

exports.updateTemplate = asyncHandler(async (req, res) => {
    const template = await taskTemplateService.updateTemplate(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ success: true, data: template });
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
    const result = await taskTemplateService.deleteTemplate(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
});

exports.applyTemplate = asyncHandler(async (req, res) => {
    const { targetUserId } = req.body;
    const task = await taskTemplateService.applyTemplate(req.params.id, targetUserId || req.user.id, req.user.id, req.ip);
    res.status(201).json({ success: true, message: 'Task created from template.', data: task });
});
