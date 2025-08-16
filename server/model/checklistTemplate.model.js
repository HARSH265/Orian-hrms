const mongoose = require('mongoose');

const ChecklistTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a template name'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
    },
    // An array of TaskTemplate documents
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TaskTemplate'
    }]
}, { timestamps: true });

module.exports = mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);