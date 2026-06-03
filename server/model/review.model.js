const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
    goal: { type: String, required: true, trim: true },
    targetDate: { type: Date },
    achieved: { type: Boolean, default: false },
    achievedDate: { type: Date },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
});

const CriteriaSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    weight: { type: Number, required: true, min: 0, max: 100 },
    score: { type: Number, min: 1, max: 5 },
}, { _id: false });

const ReviewSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewTemplate' },
    cycleName: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['Pending Self-Assessment', 'Pending Manager Review', 'Pending Approval', 'Complete', 'Archived'],
        default: 'Pending Self-Assessment',
    },
    rating: { type: Number, min: 1, max: 5 },
    weightedScore: { type: Number, default: 0 },

    selfAssessment: {
        strengths: { type: String, default: '' },
        areasForImprovement: { type: String, default: '' },
        feedback: { type: String, default: '' },
    },
    employeeSubmitDate: { type: Date },

    managerReview: {
        overallPerformance: { type: String, default: '' },
        goalsForNextCycle: { type: String, default: '' },
        managerFeedback: { type: String, default: '' },
    },
    managerSubmitDate: { type: Date },

    goals: [GoalSchema],
    criteria: [CriteriaSchema],

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
}, { timestamps: true });

ReviewSchema.index({ employee: 1, createdAt: -1 });
ReviewSchema.index({ manager: 1, createdAt: -1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ template: 1 });

module.exports = mongoose.model('Review', ReviewSchema);
