const asyncHandler = require('../utils/asyncHandler');
const kudosService = require('../services/kudosService');

exports.createKudos = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId, message, companyValue } = req.body;
        const kudos = await kudosService.createKudos(req.user, recipientId, message, companyValue, req);
        res.status(201).json({ success: true, data: kudos });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.getAllKudos = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await kudosService.getAllKudos({ page, limit });
    res.json({ success: true, ...result });
});

exports.getUserKudos = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await kudosService.getUserKudos(req.params.userId, { page, limit });
    res.json({ success: true, ...result });
});

exports.deleteKudos = asyncHandler(async (req, res, next) => {
    try {
        const result = await kudosService.deleteKudos(req.params.id, req.user.id, req.ip);
        res.json({ success: true, ...result });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.exportKudos = asyncHandler(async (req, res) => {
    const csv = await kudosService.exportKudosCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="kudos-export.csv"');
    res.send(csv);
});
