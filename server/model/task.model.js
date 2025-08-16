const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['To Do', 'In Progress', 'Done'],
        default: 'To Do',
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // A task must be assigned to someone
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // We need to know who created the task
    },
    dueDate: {
        type: Date,
    },
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);