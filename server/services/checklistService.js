const mongoose = require('mongoose');
const ChecklistTemplate = require('../model/checklistTemplate.model');
const Task = require('../model/task.model');
const User = require('../model/user');
const ChecklistInstance = require('../model/checklistInstance.model');
const { createAuditLog } = require('./auditLogService');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

const applyChecklist = async ({ templateId, targetUserId, creator, startDate, req }) => {
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
                generatedTasks: [],
            });
            const taskCreationData = [];
            const sortedTaskTemplates = [...template.tasks].sort((a, b) => a.dueDays - b.dueDays);

            for (const taskTemplate of sortedTaskTemplates) {
                let assigneeIds = [];

                switch (taskTemplate.defaultAssignee.assigneeType) {
                    case 'TargetUser':
                        assigneeIds.push(targetUser._id);
                        break;
                    case 'TargetUsersManager':
                        if (targetUser.manager?._id) {
                            assigneeIds.push(targetUser.manager._id);
                        }
                        break;
                    case 'HRTrigger':
                        assigneeIds.push(creator.id);
                        break;
                    case 'Creator':
                        assigneeIds.push(creator.id);
                        break;
                    case 'Role':
                        if (taskTemplate.defaultAssignee.roleId) {
                            const usersInRole = await User.find({
                                roles: taskTemplate.defaultAssignee.roleId,
                                isActive: true,
                            }).select('_id').session(session);
                            assigneeIds.push(...usersInRole.map(u => u._id));
                        }
                        break;
                    default:
                        logger.warn(`Unknown assigneeType: ${taskTemplate.defaultAssignee.assigneeType} for task template "${taskTemplate.title}"`);
                }

                if (assigneeIds.length === 0) {
                    logger.info(`Skipping task "${taskTemplate.title}" for template "${template.name}" due to no assignees found.`);
                    continue;
                }

                const dueDate = new Date(startDate);
                dueDate.setDate(dueDate.getDate() + taskTemplate.dueDays);

                taskCreationData.push({
                    title: taskTemplate.title,
                    description: taskTemplate.description,
                    assignees: assigneeIds,
                    creator: creator.id,
                    dueDate,
                    checklistInstance: checklistInstance._id,
                });
            }

            if (taskCreationData.length > 0) {
                const createdTasks = await Task.insertMany(taskCreationData, { session });
                createdTasksCount = createdTasks.length;
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
                    tasksGenerated: createdTasks.length,
                },
                ipAddress: req.ip,
            });
        });

        await createNotification({
            recipient: targetUserId,
            message: `Checklist "${templateName}" has been applied to you with ${createdTasksCount} task(s).`,
            link: '/checklists', type: 'Task',
        }, req);

        return { success: true, message: `${createdTasksCount} tasks generated from template "${templateName}".` };
    } catch (error) {
        throw error;
    } finally {
        session.endSession();
    }
};

const completeInstance = async (instanceId, userId, req) => {
    const instance = await ChecklistInstance.findById(instanceId);
    if (!instance) throw new Error('Checklist instance not found.');
    if (instance.status === 'Completed') throw new Error('Checklist is already completed.');

    instance.status = 'Completed';
    instance.completionDate = new Date();
    await instance.save();

    await createAuditLog({
        actor: userId, action: 'CHECKLIST_COMPLETED',
        target: { id: instance._id, type: 'ChecklistInstance' },
        details: { template: instance.template, targetUser: instance.targetUser },
        ipAddress: req?.ip,
    });

    return instance.populate('template', 'name').populate('targetUser', 'name');
};

const checkAndAutoComplete = async (taskId) => {
    const task = await Task.findById(taskId).select('checklistInstance status');
    if (!task || !task.checklistInstance) return;

    const instance = await ChecklistInstance.findById(task.checklistInstance);
    if (!instance || instance.status === 'Completed') return;

    const allTasks = await Task.find({ checklistInstance: instance._id }).select('status');
    const allDone = allTasks.every(t => t.status === 'Done');

    if (allDone) {
        instance.status = 'Completed';
        instance.completionDate = new Date();
        await instance.save();
    }
};

module.exports = { applyChecklist, completeInstance, checkAndAutoComplete };
