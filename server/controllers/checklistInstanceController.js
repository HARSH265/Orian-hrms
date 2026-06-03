const { getActiveChecklistInstances, getInstanceById } = require('../services/checklistInstanceService');
const { completeInstance, checkAndAutoComplete } = require('../services/checklistService');
const asyncHandler = require('../utils/asyncHandler');

exports.getActiveChecklistInstances = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getActiveChecklistInstances(req.user, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
});

exports.getInstanceById = asyncHandler(async (req, res, next) => {
    try {
        const instance = await getInstanceById(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: instance });
    } catch (error) { next(error); }
});

exports.completeInstance = asyncHandler(async (req, res, next) => {
    try {
        const instance = await completeInstance(req.params.id, req.user.id, req);
        res.status(200).json({ success: true, data: instance, message: 'Checklist completed.' });
    } catch (error) { next(error); }
});

exports.autoComplete = asyncHandler(async (req, res, next) => {
    try {
        const { taskId } = req.body;
        if (!taskId) return res.status(400).json({ success: false, message: 'Task ID is required' });
        await checkAndAutoComplete(taskId);
        res.status(200).json({ success: true, message: 'Auto-complete check done.' });
    } catch (error) { next(error); }
});
