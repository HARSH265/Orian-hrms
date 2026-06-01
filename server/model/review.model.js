const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    employee: { // The person being reviewed
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    manager: { // The manager conducting the review
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cycleName: { // e.g., "2025 Annual Performance Review"
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: [
            'Pending Self-Assessment',
            'Pending Manager Review',
            'Complete',
            'Archived'
        ],
        default: 'Pending Self-Assessment',
    },
    // --- Employee's Part ---
    selfAssessment: {
        strengths: { type: String, default: '' },
        areasForImprovement: { type: String, default: '' },
        feedback: { type: String, default: '' }, // Feedback for their manager/company
    },
    employeeSubmitDate: {
        type: Date,
    },
    // --- Manager's Part ---
    managerReview: {
        overallPerformance: { type: String, default: '' },
        goalsForNextCycle: { type: String, default: '' },
        managerFeedback: { type: String, default: '' }, // Feedback for the employee
    },
    managerSubmitDate: {
        type: Date,
    },
}, { timestamps: true });

ReviewSchema.index({ employee: 1, createdAt: -1 });
ReviewSchema.index({ manager: 1, createdAt: -1 });

module.exports = mongoose.model('Review', ReviewSchema);