const mongoose = require('mongoose');

const ReviewScheduleSchema = new mongoose.Schema({
    cycleName: { type: String, required: true, trim: true },
    frequency: { type: String, enum: ['quarterly', 'annual'], required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    startDate: { type: Date, required: true },
    selfAssessmentDeadline: { type: Number, default: 14 },
    managerDeadline: { type: Number, default: 21 },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewTemplate' },
    isActive: { type: Boolean, default: true },
    lastRun: { type: Date },
    nextRun: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('ReviewSchedule', ReviewScheduleSchema);
