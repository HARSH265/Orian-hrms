const ChecklistTemplate = require('../model/checklistTemplate.model');
const TaskTemplate = require('../model/taskTemplate.model');
const Task = require('../model/task.model');
const User = require('../model/user');
const ChecklistInstance = require('../model/checklistInstance.model'); 
const { applyChecklist } = require('../services/checklistService');
const asyncHandler = require('../utils/asyncHandler');

// --- Standard CRUD for Checklist Templates ---

// @desc    Get all checklist templates
// @route   GET /api/checklist-templates
exports.getAllChecklistTemplates = asyncHandler(async (req, res) => {
    const templates = await ChecklistTemplate.find({}).populate('tasks');
    res.status(200).json({ success: true, data: templates });
});

// @desc    Create a new checklist template
// @route   POST /api/checklist-templates
exports.createChecklistTemplate = asyncHandler(async (req, res) => {
    // This is a complex transaction.
    // 1. The request body will contain the template name and an array of task objects.
    const { name, description, tasks } = req.body;

    // 2. Create all the individual TaskTemplate documents first.
    const taskTemplateDocs = await TaskTemplate.create(tasks);

    // 3. Get the IDs of the newly created task templates.
    const taskTemplateIds = taskTemplateDocs.map(task => task._id);

    // 4. Create the main ChecklistTemplate, linking it to the task templates.
    const checklistTemplate = await ChecklistTemplate.create({
        name,
        description,
        tasks: taskTemplateIds
    });

    res.status(201).json({ success: true, data: checklistTemplate });
});

// ... We can add update and delete functions later. Let's focus on create and run. ...


// --- The "Magic" Function: Applying a Template ---

// @desc    Apply a checklist template to a user, generating real tasks
// @route   POST /api/checklist-templates/apply
exports.applyChecklistTemplate = asyncHandler(async (req, res) => {
    const { templateId, targetUserId, startDate } = req.body;
    const result = await applyChecklist({
        templateId,
        targetUserId,
        creator: req.user,
        startDate,
        req
    });
    res.status(201).json(result);
});

// @desc    Update an existing checklist template
// @route   PUT /api/checklist-templates/:id
exports.updateChecklistTemplate = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const { name, description, tasks } = req.body;
            const templateId = req.params.id;

            const template = await ChecklistTemplate.findById(templateId).session(session);
            if (!template) {
                throw new Error('Checklist template not found.');
            }

            // Update the simple fields
            template.name = name;
            template.description = description;

            const existingTaskTemplateIds = template.tasks.map(t => t.toString());
            const incomingTaskTemplateIds = tasks.filter(t => t._id).map(t => t._id);

            // 1. Identify TaskTemplates to delete
            const taskTemplatesToDelete = existingTaskTemplateIds.filter(id => !incomingTaskTemplateIds.includes(id));
            if (taskTemplatesToDelete.length > 0) {
                await TaskTemplate.deleteMany({ _id: { $in: taskTemplatesToDelete } }, { session });
            }

            // 2. Identify and update existing TaskTemplates
            const taskTemplatesToUpdate = tasks.filter(t => t._id);
            for (const taskData of taskTemplatesToUpdate) {
                await TaskTemplate.updateOne({ _id: taskData._id }, { $set: taskData }, { session });
            }
            
            // 3. Identify and create new TaskTemplates
            const taskTemplatesToCreate = tasks.filter(t => !t._id);
            let newTaskTemplateIds = [];
            if (taskTemplatesToCreate.length > 0) {
                const newTaskTemplates = await TaskTemplate.create(taskTemplatesToCreate, { session });
                newTaskTemplateIds = newTaskTemplates.map(t => t._id);
            }

            // 4. Update the main template's task list
            template.tasks = [...incomingTaskTemplateIds, ...newTaskTemplateIds];
            const updatedTemplate = await template.save({ session });
            
            await createAuditLog({
                actor: req.user.id, action: 'CHECKLIST_TEMPLATE_UPDATED',
                target: { id: updatedTemplate._id, type: 'ChecklistTemplate' },
                details: { name: updatedTemplate.name }, ipAddress: req.ip
            });

            res.status(200).json({ success: true, data: updatedTemplate });
        });
    } catch (error) {
        next(error);
    } finally {
        session.endSession();
    }
};

// @desc    Delete a checklist template
// @route   DELETE /api/checklist-templates/:id
exports.deleteChecklistTemplate = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const templateId = req.params.id;

            const template = await ChecklistTemplate.findById(templateId).session(session);
            if (!template) {
                throw new Error('Checklist template not found.');
            }

            // IMPORTANT: Prevent deletion if the template is in use
            const instancesInUse = await ChecklistInstance.countDocuments({ template: templateId }).session(session);
            if (instancesInUse > 0) {
                throw new Error(`Cannot delete. This template is in use by ${instancesInUse} checklist(s).`);
            }
            
            // Delete the associated task templates
            if (template.tasks && template.tasks.length > 0) {
                await TaskTemplate.deleteMany({ _id: { $in: template.tasks } }, { session });
            }

            // Delete the main template
            await template.remove({ session });

            await createAuditLog({
                actor: req.user.id, action: 'CHECKLIST_TEMPLATE_DELETED',
                target: { id: template._id, type: 'ChecklistTemplate' },
                details: { name: template.name }, ipAddress: req.ip
            });

            res.status(200).json({ success: true, message: 'Checklist template deleted successfully.' });
        });
    } catch (error) {
        // Pass a more user-friendly error message to the frontend
        next(new Error(error.message || 'Could not delete template.'));
    } finally {
        session.endSession();
    }
};