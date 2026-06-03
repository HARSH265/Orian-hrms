const surveyService = require('../services/surveyService');
const asyncHandler = require('../utils/asyncHandler');

exports.createSurvey = asyncHandler(async (req, res, next) => {
    try {
        const survey = await surveyService.createSurvey(req.body, req.user._id, req);
        res.status(201).json({ success: true, data: survey });
    } catch (error) { next(error); }
});

exports.getAllSurveys = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await surveyService.getAllSurveys({ page, limit, status });
    res.json({ success: true, ...result });
});

exports.getSurveyById = asyncHandler(async (req, res, next) => {
    try {
        const result = await surveyService.getSurveyById(req.params.id, req.user._id, req.user.systemRole);
        if (result.error === 'not_found') return res.status(404).json({ success: false, message: 'Survey not found.' });
        if (result.error === 'unauthorized') return res.status(403).json({ success: false, message: 'Not authorized.' });
        res.json({ success: true, data: result.survey });
    } catch (error) { next(error); }
});

exports.getMyAssignedSurveys = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await surveyService.getMyAssignedSurveys(req.user._id, { page, limit });
    res.json({ success: true, ...result });
});

exports.submitResponse = asyncHandler(async (req, res, next) => {
    try {
        const result = await surveyService.submitResponse(req.params.id, req.body.answers, req.user, req);
        if (result.error === 'not_active') return res.status(400).json({ success: false, message: 'Survey is not active.' });
        if (result.error === 'already_responded') return res.status(400).json({ success: false, message: 'Already responded.' });
        res.status(201).json({ success: true, message: 'Response submitted.' });
    } catch (error) { next(error); }
});

exports.getSurveyResults = asyncHandler(async (req, res, next) => {
    try {
        const result = await surveyService.getSurveyResults(req.params.id);
        if (result.error === 'not_found') return res.status(404).json({ success: false, message: 'Survey not found.' });
        res.json({ success: true, data: { totalResponses: result.totalResponses, results: result.results } });
    } catch (error) { next(error); }
});

exports.updateSurvey = asyncHandler(async (req, res, next) => {
    try {
        const result = await surveyService.updateSurvey(req.params.id, req.body);
        if (result.error === 'not_found') return res.status(404).json({ success: false, message: 'Survey not found.' });
        if (result.error === 'closed') return res.status(400).json({ success: false, message: 'Cannot edit a closed survey.' });
        res.json({ success: true, data: result.survey });
    } catch (error) { next(error); }
});

exports.deleteSurvey = asyncHandler(async (req, res, next) => {
    try {
        const result = await surveyService.deleteSurvey(req.params.id);
        if (result.error === 'not_found') return res.status(404).json({ success: false, message: 'Survey not found.' });
        res.json({ success: true, message: 'Survey closed.' });
    } catch (error) { next(error); }
});

exports.exportSurveys = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const csv = await surveyService.exportSurveysCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="surveys-export.csv"');
    res.send(csv);
});
