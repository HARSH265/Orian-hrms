const asyncHandler = require('../utils/asyncHandler');
const reviewTemplateService = require('../services/reviewTemplateService');

exports.getAll = asyncHandler(async (req, res) => {
    const templates = await reviewTemplateService.getAll();
    res.json({ success: true, data: templates });
});

exports.getById = asyncHandler(async (req, res) => {
    const result = await reviewTemplateService.getById(req.params.id);
    res.json({ success: true, data: result });
});

exports.create = asyncHandler(async (req, res) => {
    const result = await reviewTemplateService.create(req.body, req.user._id);
    res.status(201).json({ success: true, data: result });
});

exports.update = asyncHandler(async (req, res) => {
    const result = await reviewTemplateService.update(req.params.id, req.body);
    res.json({ success: true, data: result });
});

exports.remove = asyncHandler(async (req, res) => {
    const result = await reviewTemplateService.remove(req.params.id);
    res.json({ success: true, ...result });
});
