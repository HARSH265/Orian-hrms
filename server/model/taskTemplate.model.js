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
        type: String,
        required: true,
        enum: ['New Employee', 'Manager', 'HR'], // We can expand this later to specific users
    },
    dueDays: {
        type: Number, // e.g., Task is due 3 days after the start date
        default: 0,
    }
});

module.exports = mongoose.model('TaskTemplate', TaskTemplateSchema);