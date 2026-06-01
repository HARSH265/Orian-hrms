// In: server/model/task.model.js

const mongoose = require('mongoose');

// =================================================================================
// --- TASK MODEL ---
// Version: 2.5
// Changes:
// - V2.4: Multiple assignees, sub-tasks, etc.
// - V2.5: Added `reopenRequests` sub-schema and array for the new workflow.
// =================================================================================

const CommentSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// --- NEW: A sub-schema to track re-open requests ---
const ReopenRequestSchema = new mongoose.Schema({
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date }
}, { timestamps: true });

const TimeLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timeSpent: { type: Number, required: true }, // Time in hours
    date: { type: Date, required: true },
    notes: { type: String, trim: true },
}, { timestamps: true });

// --- Main Task Schema ---
const TaskSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Please add a task title'], trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ['To Do', 'In Progress', 'Done', 'Blocked'], default: 'To Do' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    
    assignees: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        validate: [{ validator: (val) => val.length > 0, msg: 'At least one assignee is required.' }]
    },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },

     timeEstimate: { 
        type: Number,
        default: 0,
    },
    totalTimeSpent: { 
        type: Number,
        default: 0,
    },
     subscribers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    timeLogs: [TimeLogSchema],  

    
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    comments: [CommentSchema],
    
    parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    subTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    
    // --- NEW: The array to store the history of re-open requests ---
    reopenRequests: [ReopenRequestSchema],
    dependsOn:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Task'
    }],
    blocking:[{
         type:mongoose.Schema.Types.ObjectId,
        ref:'Task'
    }],
     checklistInstance: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChecklistInstance',
        default: null, // Will be null for tasks created manually
    },
     customFieldValues: [{
        field: { // Reference to the CustomField definition
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CustomField',
            required: true,
        },
        value: { // The actual value, which can be any type
            type: mongoose.Schema.Types.Mixed,
        }
    }],
    

}, { timestamps: true });

// Indexes for common queries
TaskSchema.index({ creator: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ assignees: 1, status: 1 });
TaskSchema.index({ creator: 1, status: 1 });
TaskSchema.index({ status: 1, priority: 1 });

module.exports = mongoose.model('Task', TaskSchema);