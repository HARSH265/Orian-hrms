const mongoose = require('mongoose');
const ChecklistTemplate = require('../model/checklistTemplate.model');
const Task = require('../model/task.model');
const User = require('../model/user');
const ChecklistInstance = require('../model/checklistInstance.model');
const { createAuditLog } = require('./auditLogService');

const applyChecklist = async ({ templateId, targetUserId, creator, startDate, req }) => {
    // This is the exact same logic from your applyChecklistTemplate controller,
    // now encapsulated in a reusable service function.
    const session = await mongoose.startSession();
    try {
        let createdTasksCount = 0;
        let templateName = '';

        await session.withTransaction(async () => {
            const template = await ChecklistTemplate.findById(templateId).populate('tasks').session(session);
            const targetUser = await User.findById(targetUserId).populate('manager').session(session);

            if (!template || !targetUser) { throw new Error('Template or target user not found.'); }
            templateName = template.name;

             const checklistInstance = new ChecklistInstance({
                template: templateId,
                targetUser: targetUserId,
                startDate,
                createdBy: creator.id,
                generatedTasks: [] // Will be populated after tasks are created
            });
            const taskCreationData = [];
            const sortedTaskTemplates = [...template.tasks].sort((a, b) => a.dueDays - b.dueDays);
            
            for (const taskTemplate of sortedTaskTemplates) {
                let assigneeIds = []; // Changed to an array to support multiple assignees from a role

                // --- NEW: Advanced Assignee Logic ---
                switch (taskTemplate.defaultAssignee.assigneeType) {
                    case 'TargetUser':
                        assigneeIds.push(targetUser._id);
                        break;
                    case 'TargetUsersManager':
                        if (targetUser.manager?._id) {
                            assigneeIds.push(targetUser.manager._id);
                        }
                        break;
                    case 'HRTrigger': // The HR user who initiated the process
                        assigneeIds.push(creator.id);
                        break;
                    case 'Role':
                        if (taskTemplate.defaultAssignee.roleId) {
                            // Find all active users who have this specific role
                            const usersInRole = await User.find({ 
                                roles: taskTemplate.defaultAssignee.roleId,
                                isActive: true 
                            }).select('_id').session(session);
                            assigneeIds.push(...usersInRole.map(u => u._id));
                        }
                        break;
                    default:
                        // Log a warning if the assignee type is unknown
                        console.warn(`Unknown assigneeType: ${taskTemplate.defaultAssignee.assigneeType} for task template "${taskTemplate.title}"`);
                }

                // If no valid assignees were found for this rule, skip creating the task
                if (assigneeIds.length === 0) {
                    console.log(`Skipping task "${taskTemplate.title}" for template "${template.name}" due to no assignees found.`);
                    continue;
                }
                
                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + taskTemplate.dueDays);

                // Prepare the data for the new Task document
                taskCreationData.push({
                    title: taskTemplate.title,
                    description: taskTemplate.description,
                    assignees: assigneeIds,
                    creator: creator.id,
                    dueDate,
                    checklistInstance: checklistInstance._id // Link back to the instance
                });
            }

            if (taskCreationData.length > 0) {
                const createdTasks = await Task.insertMany(taskCreationData, { session });
                createdTasksCount = createdTasks.length;
                
                // ... dependency linking logic ...
                
                checklistInstance.generatedTasks = createdTasks.map(t => t._id);
            }
            
            await checklistInstance.save({ session });
            await createAuditLog({
                actor: creator.id, 
                action: 'CHECKLIST_APPLIED',
                target: { id: checklistInstance._id, type: 'ChecklistInstance' },
                details: { 
                    templateName: template.name, 
                    targetUser: targetUser.name,
                    tasksGenerated: createdTasks.length
                },
                ipAddress: req.ip
            });
        });
        
        return { success: true, message: `${createdTasksCount} tasks generated from template "${templateName}".` };
    } catch (error) {
        throw error; // Let the controller handle the error
    } finally {
        session.endSession();
    }
};

module.exports = { applyChecklist };


