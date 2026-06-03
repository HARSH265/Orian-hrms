const mongoose = require('mongoose');
const ChecklistTemplate = require('../model/checklistTemplate.model');
const TaskTemplate = require('../model/taskTemplate.model');
const ChecklistInstance = require('../model/checklistInstance.model');
const { checklistService } = require('../services');
const { createAuditLog } = require('../services/auditLogService');
const asyncHandler = require('../utils/asyncHandler');
const { parsePagination, buildPagination } = require('../utils/pagination');

exports.getAllChecklistTemplates = asyncHandler(async (req, res) => {
    const { page, limit, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    const { page: p, limit: l, skip } = parsePagination({ page, limit });

    const query = { isActive: { $ne: false } };
    if (search) query.name = { $regex: search, $options: 'i' };

    const sortOrder = order === 'asc' ? 1 : -1;
    const [templates, total] = await Promise.all([
        ChecklistTemplate.find(query)
            .populate('tasks')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(l),
        ChecklistTemplate.countDocuments(query),
    ]);

    res.status(200).json({ success: true, data: templates, pagination: buildPagination(total, p, l) });
});

exports.getChecklistTemplateById = asyncHandler(async (req, res) => {
    const template = await ChecklistTemplate.findById(req.params.id).populate('tasks');
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.status(200).json({ success: true, data: template });
});

exports.createChecklistTemplate = asyncHandler(async (req, res) => {
    const { name, description, tasks } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Template name is required' });
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one task is required' });
    }

    const taskData = tasks.map(t => ({ ...t, createdBy: req.user.id, checklistTemplate: null }));
    const taskTemplateDocs = await TaskTemplate.create(taskData);
    const taskTemplateIds = taskTemplateDocs.map(task => task._id);

    await TaskTemplate.updateMany(
        { _id: { $in: taskTemplateIds } },
        { checklistTemplate: taskTemplateDocs[0]?.checklistTemplate || null },
    );

    const checklistTemplate = await ChecklistTemplate.create({ name, description, tasks: taskTemplateIds });

    await createAuditLog({
        actor: req.user.id, action: 'CHECKLIST_TEMPLATE_CREATED',
        target: { id: checklistTemplate._id, type: 'ChecklistTemplate' },
        details: { name }, ipAddress: req.ip,
    });

    res.status(201).json({ success: true, data: checklistTemplate });
});

exports.applyChecklistTemplate = asyncHandler(async (req, res) => {
    const { templateId, targetUserId, startDate } = req.body;
    const result = await checklistService.applyChecklist({
        templateId, targetUserId, creator: req.user, startDate, req,
    });
    res.status(201).json(result);
});

exports.updateChecklistTemplate = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const { name, description, tasks } = req.body;
            const templateId = req.params.id;

            const template = await ChecklistTemplate.findById(templateId).session(session);
            if (!template) throw new Error('Checklist template not found.');

            template.name = name;
            template.description = description;

            const existingTaskTemplateIds = template.tasks.map(t => t.toString());
            const incomingTaskTemplateIds = tasks.filter(t => t._id).map(t => t._id);

            const taskTemplatesToDelete = existingTaskTemplateIds.filter(id => !incomingTaskTemplateIds.includes(id));
            if (taskTemplatesToDelete.length > 0) {
                await TaskTemplate.deleteMany({ _id: { $in: taskTemplatesToDelete } }, { session });
            }

            const taskTemplatesToUpdate = tasks.filter(t => t._id);
            for (const taskData of taskTemplatesToUpdate) {
                await TaskTemplate.updateOne({ _id: taskData._id }, { $set: taskData }, { session });
            }

            const taskTemplatesToCreate = tasks.filter(t => !t._id);
            let newTaskTemplateIds = [];
            if (taskTemplatesToCreate.length > 0) {
                const newData = taskTemplatesToCreate.map(t => ({ ...t, createdBy: req.user.id }));
                const newTaskTemplates = await TaskTemplate.create(newData, { session });
                newTaskTemplateIds = newTaskTemplates.map(t => t._id);
                await TaskTemplate.updateMany(
                    { _id: { $in: newTaskTemplateIds } },
                    { checklistTemplate: templateId },
                    { session },
                );
            }

            template.tasks = [...incomingTaskTemplateIds, ...newTaskTemplateIds];
            const updatedTemplate = await template.save({ session });

            await createAuditLog({
                actor: req.user.id, action: 'CHECKLIST_TEMPLATE_UPDATED',
                target: { id: updatedTemplate._id, type: 'ChecklistTemplate' },
                details: { name: updatedTemplate.name }, ipAddress: req.ip,
            });

            res.status(200).json({ success: true, data: updatedTemplate });
        });
    } catch (error) {
        next(error);
    } finally {
        session.endSession();
    }
});

exports.deleteChecklistTemplate = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const templateId = req.params.id;

            const template = await ChecklistTemplate.findById(templateId).session(session);
            if (!template) throw new Error('Checklist template not found.');

            const instancesInUse = await ChecklistInstance.countDocuments({ template: templateId }).session(session);
            if (instancesInUse > 0) {
                throw new Error(`Cannot delete. This template is in use by ${instancesInUse} checklist(s).`);
            }

            if (template.tasks && template.tasks.length > 0) {
                await TaskTemplate.deleteMany({ _id: { $in: template.tasks } }, { session });
            }

            await template.deleteOne({ session });

            await createAuditLog({
                actor: req.user.id, action: 'CHECKLIST_TEMPLATE_DELETED',
                target: { id: template._id, type: 'ChecklistTemplate' },
                details: { name: template.name }, ipAddress: req.ip,
            });

            res.status(200).json({ success: true, message: 'Checklist template deleted successfully.' });
        });
    } catch (error) {
        next(new Error(error.message || 'Could not delete template.'));
    } finally {
        session.endSession();
    }
});
