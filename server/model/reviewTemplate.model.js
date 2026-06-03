const mongoose = require('mongoose');

const ReviewTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    criteria: [{
        name: { type: String, required: true, trim: true },
        weight: { type: Number, required: true, min: 0, max: 100 },
        description: { type: String, trim: true },
    }],
    selfAssessmentQuestions: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ReviewTemplate', ReviewTemplateSchema);
