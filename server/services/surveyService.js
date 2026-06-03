const Survey = require('../model/Survey');
const SurveyResponse = require('../model/SurveyResponse');
const { createNotification } = require('./notificationService');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const createSurvey = async (surveyData, userId, req) => {
    const { title, description, isAnonymous, recipients, questions } = surveyData;
    const survey = await Survey.create({ title, description, isAnonymous, recipients, questions, creator: userId, status: 'active' });

    const notificationPromises = recipients.map(recipientId =>
        createNotification({
            recipient: recipientId, sender: userId,
            message: `You have been assigned a new survey: "${title}"`,
            link: '/surveys', type: 'General',
        }, req)
    );
    await Promise.all(notificationPromises);

    await createAuditLog({
        actor: userId, action: 'SURVEY_CREATED',
        target: { id: survey._id, type: 'Survey' },
        details: { title },
        ipAddress: req?.ip,
    });

    return survey;
};

const getAllSurveys = async ({ page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (status) query.status = status;
    const [surveys, total] = await Promise.all([
        Survey.find(query).populate('creator', 'name').sort({ createdAt: -1 }).lean().skip(skip).limit(l),
        Survey.countDocuments(query)
    ]);
    return { data: surveys, pagination: buildPagination(total, p, l) };
};

const getSurveyById = async (id, userId, userSystemRole) => {
    const survey = await Survey.findById(id).lean();
    if (!survey) return { error: 'not_found' };

    const isRecipient = survey.recipients.some(rid => rid.equals(userId));
    if (userSystemRole !== 'hr' && userSystemRole !== 'super-admin' && !isRecipient) {
        return { error: 'unauthorized' };
    }

    return { survey };
};

const getMyAssignedSurveys = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { recipients: userId, status: 'active' };
    const [assignedSurveys, total] = await Promise.all([
        Survey.find(query).sort({ createdAt: -1 }).lean().skip(skip).limit(l),
        Survey.countDocuments(query)
    ]);
    const userResponses = await SurveyResponse.find({ respondent: userId }).select('survey').lean();
    const respondedSurveyIds = userResponses.map(response => response.survey.toString());
    const pendingSurveys = assignedSurveys.filter(survey => !respondedSurveyIds.includes(survey._id.toString()));
    return { data: pendingSurveys, pagination: buildPagination(total, p, l) };
};

const submitResponse = async (surveyId, answers, user, req) => {
    const survey = await Survey.findById(surveyId).lean();
    if (!survey || survey.status !== 'active') return { error: 'not_active' };

    const existingResponse = await SurveyResponse.findOne({ survey: surveyId, respondent: user._id }).lean();
    if (existingResponse) return { error: 'already_responded' };

    const responseData = { survey: surveyId, answers, respondent: survey.isAnonymous ? null : user._id };
    await SurveyResponse.create(responseData);

    await createAuditLog({
        actor: user._id, action: 'SURVEY_RESPONSE_SUBMITTED',
        target: { id: surveyId, type: 'Survey' },
        ipAddress: req?.ip,
    });

    return { success: true };
};

const getSurveyResults = async (surveyId) => {
    const survey = await Survey.findById(surveyId).lean();
    if (!survey) return { error: 'not_found' };

    const responses = await SurveyResponse.find({ survey: surveyId }).lean();
    const totalResponses = responses.length;

    const results = survey.questions.map(question => {
        const questionIdStr = question._id.toString();
        let aggregatedData = {};

        switch (question.questionType) {
            case 'text':
                aggregatedData.answers = responses.map(r => r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue).filter(Boolean);
                break;
            case 'multiple-choice': {
                const voteCounts = new Map();
                question.options.forEach(opt => voteCounts.set(opt, 0));
                responses.forEach(r => {
                    const answer = r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue;
                    if (voteCounts.has(answer)) voteCounts.set(answer, voteCounts.get(answer) + 1);
                });
                aggregatedData.options = Object.fromEntries(voteCounts);
                break;
            }
            case 'rating-scale': {
                const ratings = responses.map(r => r.answers.find(a => a.questionId.toString() === questionIdStr)?.answerValue).filter(val => typeof val === 'number');
                const sum = ratings.reduce((acc, curr) => acc + curr, 0);
                aggregatedData.average = ratings.length > 0 ? (sum / ratings.length).toFixed(2) : 0;
                aggregatedData.count = ratings.length;
                break;
            }
        }

        return { questionId: question._id, questionText: question.questionText, questionType: question.questionType, results: aggregatedData };
    });

    return { totalResponses, results };
};

const updateSurvey = async (id, updateFields) => {
    const survey = await Survey.findById(id);
    if (!survey) return { error: 'not_found' };
    if (survey.status === 'closed') return { error: 'closed' };
    const { title, description } = updateFields;
    const updated = await Survey.findByIdAndUpdate(id, { title, description }, { new: true, runValidators: true });
    return { survey: updated };
};

const deleteSurvey = async (id) => {
    const survey = await Survey.findById(id);
    if (!survey) return { error: 'not_found' };
    survey.status = 'closed';
    await survey.save();
    return { success: true };
};

const exportSurveysCSV = async (filter = {}) => {
    const surveys = await Survey.find(filter)
        .populate('creator', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Title,Status,Questions,Recipients,Anonymous,Created By,Created At\n';
    const rows = surveys.map(s =>
        `"${s.title || ''}",${s.status},${s.questions?.length || 0},${s.recipients?.length || 0},${s.isAnonymous ? 'Yes' : 'No'},"${s.creator?.name || ''}",${new Date(s.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    createSurvey, getAllSurveys, getSurveyById, getMyAssignedSurveys,
    submitResponse, getSurveyResults, updateSurvey, deleteSurvey, exportSurveysCSV,
};
