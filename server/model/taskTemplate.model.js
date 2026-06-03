const mongoose = require('mongoose');

const TaskTemplateSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    category: { type: String, trim: true, default: 'General' },
    isActive: { type: Boolean, default: true },
    defaultAssignee: {
        assigneeType: {
            type: String,
            required: true,
            enum: ['TargetUser', 'TargetUsersManager', 'HRTrigger', 'Role', 'Creator']
        },
        roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null }
    },
    dueDays: { type: Number, default: 0 },
    checklistTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'ChecklistTemplate', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

TaskTemplateSchema.index({ category: 1, isActive: 1 });

module.exports = mongoose.model('TaskTemplate', TaskTemplateSchema);
