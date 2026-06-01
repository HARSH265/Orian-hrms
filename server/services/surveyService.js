const Survey = require('../model/Survey');
const SurveyResponse = require('../model/SurveyResponse');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

const createSurvey = async (surveyData, userId, req) => {
    const { title, description, isAnonymous, recipients, questions } = surveyData;
    const survey = await Survey.create({ title, description, isAnonymous, recipients, questions, creator: userId, status: 'active' });

    const notificationPromises = recipients.map(recipientId =>
        createNotification(
            {
                recipient: recipientId,
                sender: userId,
                message: `You have been assigned a new survey: "${title}"`,
                link: '/surveys', type: 'General'
            }, req)
    );
    await Promise.all(notificationPromises);

    return survey;
};

const getAllSurveys = async () => {
    const surveys = await Survey.find().populate('creator', 'name').sort({ createdAt: -1 }).lean();
    return surveys;
};

const getSurveyById = async (id, userId, userRole) => {
    const survey = await Survey.findById(id).lean();
    if (!survey) {
        return { error: 'not_found' };
    }

    const isRecipient = survey.recipients.some(rid => rid.equals(userId));
    if (userRole !== 'hr' && userRole !== 'super-admin' && !isRecipient) {
        return { error: 'unauthorized' };
    }

    return { survey };
};

const getMyAssignedSurveys = async (userId) => {
    const assignedSurveys = await Survey.find({ recipients: userId, status: 'active' }).sort({ createdAt: -1 }).lean();
    const userResponses = await SurveyResponse.find({ respondent: userId }).select('survey').lean();
    const respondedSurveyIds = userResponses.map(response => response.survey.toString());
    const pendingSurveys = assignedSurveys.filter(survey => !respondedSurveyIds.includes(survey._id.toString()));
    return pendingSurveys;
};

const submitResponse = async (surveyId, answers, user) => {
    const survey = await Survey.findById(surveyId).lean();
    if (!survey || survey.status !== 'active') {
        return { error: 'not_active' };
    }

    const existingResponse = await SurveyResponse.findOne({ survey: surveyId, respondent: user._id }).lean();
    if (existingResponse) {
        return { error: 'already_responded' };
    }

    const responseData = { survey: surveyId, answers, respondent: survey.isAnonymous ? null : user._id };
    await SurveyResponse.create(responseData);
    return { success: true };
};

const getSurveyResults = async (surveyId) => {
    const survey = await Survey.findById(surveyId).lean();
    if (!survey) {
        return { error: 'not_found' };
    }

    const responses = await SurveyResponse.find({ survey: surveyId }).lean();
    const totalResponses = responses.length;

    const results = survey.questions.map(question => {
        const questionIdStr = question._id.toString();
        let aggregatedData = {};
        switch (question.questionType) {
            case 'text':
                aggregatedData.answers = responses.map(r => r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue).filter(Boolean);
                break;
            case 'multiple-choice':
                const voteCounts = new Map();
                question.options.forEach(opt => voteCounts.set(opt, 0));
                responses.forEach(r => {
                    const answer = r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue;
                    if (voteCounts.has(answer)) { voteCounts.set(answer, voteCounts.get(answer) + 1); }
                });
                aggregatedData.options = Object.fromEntries(voteCounts);
                break;
            case 'rating-scale':
                const ratings = responses.map(r => r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue).filter(val => typeof val === 'number');
                const sum = ratings.reduce((acc, curr) => acc + curr, 0);
                aggregatedData.average = ratings.length > 0 ? (sum / ratings.length).toFixed(2) : 0;
                aggregatedData.count = ratings.length;
                break;
        }
        return { questionId: question._id, questionText: question.questionText, questionType: question.questionType, results: aggregatedData };
    });

    return { totalResponses, results };
};

const updateSurvey = async (id, updateFields) => {
    const survey = await Survey.findById(id);
    if (!survey) {
        return { error: 'not_found' };
    }

    if (survey.status === 'closed') {
        return { error: 'closed' };
    }

    const { title, description } = updateFields;
    const updated = await Survey.findByIdAndUpdate(id, { title, description }, { new: true, runValidators: true });
    return { survey: updated };
};

const deleteSurvey = async (id) => {
    const survey = await Survey.findById(id);
    if (!survey) {
        return { error: 'not_found' };
    }

    survey.status = 'closed';
    await survey.save();
    return { success: true };
};

module.exports = {
    createSurvey,
    getAllSurveys,
    getSurveyById,
    getMyAssignedSurveys,
    submitResponse,
    getSurveyResults,
    updateSurvey,
    deleteSurvey,
};
