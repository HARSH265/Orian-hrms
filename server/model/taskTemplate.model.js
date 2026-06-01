const mongoose = require('mongoose');

const TaskTemplateSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // Who should this task be assigned to, relative to the target employee?
    defaultAssignee: {
        assigneeType: {
            type: String,
            required: true,
            enum: ['TargetUser', 'TargetUsersManager', 'HRTrigger', 'Role']
        },
        // Only populated if assigneeType is 'Role'
        roleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            default: null
        }
    },
    dueDays: {
        type: Number, // e.g., Task is due 3 days after the start date
        default: 0,
    }
});

module.exports = mongoose.model('TaskTemplate', TaskTemplateSchema);