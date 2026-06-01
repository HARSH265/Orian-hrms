const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    answerValue: {
        type: mongoose.Schema.Types.Mixed, // Can store string, number, or array
        required: true,
    },
});

const surveyResponseSchema = new mongoose.Schema({
    survey: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Survey',
    },
    respondent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Can be null if the survey is anonymous
    },
    answers: [answerSchema],
}, { timestamps: true });

module.exports = mongoose.model('SurveyResponse', surveyResponseSchema);