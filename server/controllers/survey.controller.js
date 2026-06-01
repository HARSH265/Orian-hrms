const {
    createSurvey,
    getAllSurveys,
    getSurveyById,
    getMyAssignedSurveys,
    submitResponse,
    getSurveyResults,
    updateSurvey,
    deleteSurvey,
} = require('../services/surveyService');
const asyncHandler = require('../utils/asyncHandler');

exports.createSurvey = asyncHandler(async (req, res, next) => {
    try {
        const survey = await createSurvey(req.body, req.user._id, req);
        res.status(201).json({ success: true, data: survey });
    } catch (error) { next(error); }
});

exports.getAllSurveys = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getAllSurveys({ page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
});

exports.getSurveyById = asyncHandler(async (req, res, next) => {
    try {
        const result = await getSurveyById(req.params.id, req.user._id, req.user.role);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        if (result.error === 'unauthorized') {
            return res.status(403).json({ success: false, message: 'Not authorized to view this survey' });
        }
        res.status(200).json({ success: true, data: result.survey });
    } catch (error) { next(error); }
});

exports.getMyAssignedSurveys = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getMyAssignedSurveys(req.user._id, { page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
});

exports.submitResponse = asyncHandler(async (req, res, next) => {
    try {
        const result = await submitResponse(req.params.id, req.body.answers, req.user);
        if (result.error === 'not_active') {
            return res.status(400).json({ success: false, message: 'This survey is not active or does not exist.' });
        }
        if (result.error === 'already_responded') {
            return res.status(400).json({ success: false, message: 'You have already submitted a response for this survey.' });
        }
        res.status(201).json({ success: true, message: 'Survey response submitted successfully.' });
    } catch (error) { next(error); }
});

exports.getSurveyResults = asyncHandler(async (req, res, next) => {
    try {
        const result = await getSurveyResults(req.params.id);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        res.status(200).json({ success: true, data: { totalResponses: result.totalResponses, results: result.results } });
    } catch (error) {
        next(error);
    }
});

exports.updateSurvey = asyncHandler(async (req, res, next) => {
    try {
        const result = await updateSurvey(req.params.id, req.body);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        if (result.error === 'closed') {
            return res.status(400).json({ success: false, message: 'Cannot edit a closed survey.' });
        }
        res.status(200).json({ success: true, data: result.survey });
    } catch (error) {
        next(error);
    }
});

exports.deleteSurvey = asyncHandler(async (req, res, next) => {
    try {
        const result = await deleteSurvey(req.params.id);
        if (result.error === 'not_found') {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
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
