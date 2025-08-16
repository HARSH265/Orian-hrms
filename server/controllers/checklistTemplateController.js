const ChecklistTemplate = require('../model/checklistTemplate.model');
const TaskTemplate = require('../model/taskTemplate.model');
const Task = require('../model/task.model');
const User = require('../model/user');

// --- Standard CRUD for Checklist Templates ---

// @desc    Get all checklist templates
// @route   GET /api/checklist-templates
exports.getAllChecklistTemplates = async (req, res, next) => {
    try {
        const templates = await ChecklistTemplate.find({}).populate('tasks');
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new checklist template
// @route   POST /api/checklist-templates
exports.createChecklistTemplate = async (req, res, next) => {
    try {
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
    } catch (error) {
        next(error);
    }
};

// ... We can add update and delete functions later. Let's focus on create and run. ...


// --- The "Magic" Function: Applying a Template ---

// @desc    Apply a checklist template to a user, generating real tasks
// @route   POST /api/checklist-templates/apply
exports.applyChecklistTemplate = async (req, res, next) => {
    try {
        const { templateId, targetUserId, startDate } = req.body;
        const creatorId = req.user.id; // The admin applying the template

        // 1. Find the template and the target user
        const template = await ChecklistTemplate.findById(templateId).populate('tasks');
        const targetUser = await User.findById(targetUserId).populate('manager');

        if (!template || !targetUser) {
            return res.status(404).json({ success: false, message: 'Template or user not found.' });
        }

        const generatedTasks = [];
        const baseDate = new Date(startDate);

        // 2. Loop through each task template
        for (const taskTemplate of template.tasks) {
            let assigneeId = null;

            // 3. Determine the correct assignee based on the template rule
            switch (taskTemplate.defaultAssignee) {
                case 'New Employee':
                    assigneeId = targetUser._id;
                    break;
                case 'Manager':
                    assigneeId = targetUser.manager?._id;
                    break;
                case 'HR':
                    // For now, assign to the admin who triggered it.
                    // A better system might have a dedicated "Onboarding HR" user.
                    assigneeId = creatorId;
                    break;
                default:
                    assigneeId = null;
            }

            // Skip task creation if the assignee can't be determined (e.g., no manager)
            if (!assigneeId) {
                console.log(`Skipping task "${taskTemplate.title}" due to no assignee.`);
                continue;
            }
            
            // 4. Calculate the due date
            const dueDate = new Date(baseDate);
            dueDate.setDate(baseDate.getDate() + taskTemplate.dueDays);

            // 5. Create the real Task document
            generatedTasks.push({
                title: taskTemplate.title,
                description: taskTemplate.description,
                assignee: assigneeId,
                creator: creatorId,
                dueDate: dueDate,
                // We could add a link back to the source checklist instance here
            });
        }

        // 6. Bulk-insert all generated tasks into the database
        await Task.insertMany(generatedTasks);

        res.status(201).json({ success: true, message: `${generatedTasks.length} tasks generated successfully.` });
    } catch (error) {
        next(error);
    }
};