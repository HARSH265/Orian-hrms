const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
    },
    questionType: {
        type: String,
        enum: ['text', 'multiple-choice', 'rating-scale'],
        required: true,
    },
    // Only required for 'multiple-choice' type
    options: [{
        type: String,
    }],
});

const surveySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Survey title is required.'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    questions: [questionSchema],
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    status: {
        type: String,
        enum: ['draft', 'active', 'closed'],
        default: 'draft',
    },
    isAnonymous: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

module.exports = mongoose.model('Survey', surveySchema);