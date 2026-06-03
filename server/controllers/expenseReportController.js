const asyncHandler = require('../utils/asyncHandler');
const reportService = require('../services/expenseReportService');

exports.createReport = asyncHandler(async (req, res, next) => {
    try {
        const report = await reportService.createReport(req.user.id, req.body);
        res.status(201).json({ success: true, data: report });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Not found.' });
        if (error.message === 'UNAUTHORIZED') return res.status(403).json({ success: false, message: 'Unauthorized.' });
        next(error);
    }
});

exports.getMyReports = asyncHandler(async (req, res, next) => {
    try {
        const reports = await reportService.getMyReports(req.user.id);
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        next(error);
    }
});

exports.getReportById = asyncHandler(async (req, res, next) => {
    try {
        const report = await reportService.getReportById(req.params.id, req.user.id);
        if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        next(error);
    }
});

exports.submitReport = asyncHandler(async (req, res, next) => {
    try {
        const report = await reportService.submitReport(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Not found.' });
        if (error.message === 'UNAUTHORIZED') return res.status(403).json({ success: false, message: 'Unauthorized.' });
        next(error);
    }
});
