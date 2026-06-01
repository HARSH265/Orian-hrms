const Survey = require('../model/Survey');
const SurveyResponse = require('../model/SurveyResponse');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new survey
exports.createSurvey = asyncHandler(async (req, res, next) => {
    try {
        const { title, description, isAnonymous, recipients, questions } = req.body;
        const survey = await Survey.create({ title, description, isAnonymous, recipients, questions, creator: req.user._id, status: 'active' });
        const notificationPromises = recipients.map(recipientId => 
            createNotification(
                { recipient: recipientId, 
                    sender: req.user._id, 
                    message: `You have been assigned a new survey: "${title}"`, 
                    link: '/surveys', type: 'General' },req));
        await Promise.all(notificationPromises);
        res.status(201).json({ success: true, data: survey });
    } catch (error) { next(error); }
    });

// @desc    Get all surveys for admin view
exports.getAllSurveys = asyncHandler(async (req, res, next) => {
    try {
        const surveys = await Survey.find().populate('creator', 'name').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: surveys.length, data: surveys });
    } catch (error) { next(error); }
    });

// @desc    Get a single survey by ID
exports.getSurveyById = asyncHandler(async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) { return res.status(404).json({ success: false, message: 'Survey not found' }); }
        const isRecipient = survey.recipients.some(id => id.equals(req.user._id));
        if (req.user.role !== 'hr' && req.user.role !== 'super-admin' && !isRecipient) { return res.status(403).json({ success: false, message: 'Not authorized to view this survey' }); }
        res.status(200).json({ success: true, data: survey });
    } catch (error) { next(error); }
    });

// @desc    Get all active surveys assigned to the logged-in user
exports.getMyAssignedSurveys = asyncHandler(async (req, res, next) => {
    try {
        const assignedSurveys = await Survey.find({ recipients: req.user._id, status: 'active' }).sort({ createdAt: -1 });
        const userResponses = await SurveyResponse.find({ respondent: req.user._id }).select('survey');
        const respondedSurveyIds = userResponses.map(response => response.survey.toString());
        const pendingSurveys = assignedSurveys.filter(survey => !respondedSurveyIds.includes(survey._id.toString()));
        res.status(200).json({ success: true, count: pendingSurveys.length, data: pendingSurveys });
    } catch (error) { next(error); }
    });

// @desc    Submit a response to a survey
exports.submitResponse = asyncHandler(async (req, res, next) => {
    try {
        const surveyId = req.params.id;
        const { answers } = req.body;
        const survey = await Survey.findById(surveyId);
        if (!survey || survey.status !== 'active') { return res.status(400).json({ success: false, message: 'This survey is not active or does not exist.' }); }
        const existingResponse = await SurveyResponse.findOne({ survey: surveyId, respondent: req.user._id });
        if (existingResponse) { return res.status(400).json({ success: false, message: 'You have already submitted a response for this survey.' }); }
        const responseData = { survey: surveyId, answers, respondent: survey.isAnonymous ? null : req.user._id     });
        await SurveyResponse.create(responseData);
        res.status(201).json({ success: true, message: 'Survey response submitted successfully.' });
    } catch (error) { next(error); }
    });

// @desc    Get aggregated results for a survey
exports.getSurveyResults = asyncHandler(async (req, res, next) => {
    try {
        const surveyId = req.params.id;
        const survey = await Survey.findById(surveyId).lean();
        if (!survey) { return res.status(404).json({ success: false, message: 'Survey not found' }); }
        
        const responses = await SurveyResponse.find({ survey: surveyId });
        const totalResponses = responses.length;

        const results = survey.questions.map(question => {
            const questionIdStr = question._id.toString();
            let aggregatedData = {    });
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
            return { questionId: question._id, questionText: question.questionText, questionType: question.questionType, results: aggregatedData     });
        });

        res.status(200).json({ success: true, data: { totalResponses, results } });
    } catch (error) {
        next(error);
    }
    });

// @desc    Update a survey (e.g., to close it)
// @route   PUT /api/surveys/:id
// @access  Private/Admin
exports.updateSurvey = asyncHandler(async (req, res, next) => {
    try {
        const { title, description } = req.body;
        
        let survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        
        // Only allow editing if the survey is not closed
        if (survey.status === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot edit a closed survey.' });
        }

        survey = await Survey.findByIdAndUpdate(req.params.id, { title, description }, { new: true, runValidators: true });
        
        res.status(200).json({ success: true, data: survey });
    } catch (error) {
        next(error);
    }
    });


// @desc    Soft delete a survey by changing its status
// @route   DELETE /api/surveys/:id
// @access  Private/Admin
exports.deleteSurvey = asyncHandler(async (req, res, next) => {
    try {
        const survey = await Survey.findById(req.params.id);
        if (!survey) {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }

        // Instead of removing, we set the status to 'closed'. This is our soft delete.
        survey.status = 'closed';
        await survey.save();
        
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
    });


module.exports = {
    createSurvey: exports.createSurvey,
    getAllSurveys: exports.getAllSurveys,
    getSurveyById: exports.getSurveyById,
    updateSurvey: exports.updateSurvey,
    deleteSurvey: exports.deleteSurvey,
    submitResponse: exports.submitResponse,
    getSurveyResults: exports.getSurveyResults,
    getMyAssignedSurveys: exports.getMyAssignedSurveys,
};