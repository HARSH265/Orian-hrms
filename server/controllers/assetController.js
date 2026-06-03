const assetService = require('../services/assetService');
const asyncHandler = require('../utils/asyncHandler');

exports.getAllAssets = asyncHandler(async (req, res) => {
    const result = await assetService.getAllAssets(req.query);
    res.status(200).json({ success: true, count: result.assets.length, ...result });
});

exports.getAssetById = asyncHandler(async (req, res) => {
    const asset = await assetService.getAssetById(req.params.id);
    if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
    res.status(200).json({ success: true, data: asset });
});

exports.createAsset = asyncHandler(async (req, res) => {
    const asset = await assetService.createAsset(req.body, req.user.id, req.ip);
    res.status(201).json({ success: true, data: asset });
});

exports.updateAsset = asyncHandler(async (req, res) => {
    const asset = await assetService.updateAsset(req.params.id, req.body, req.user.id, req.ip);
    res.status(200).json({ success: true, data: asset });
});

exports.deleteAsset = asyncHandler(async (req, res) => {
    const result = await assetService.deleteAsset(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
});

exports.getMyAssets = asyncHandler(async (req, res) => {
    const myAssets = await assetService.getMyAssets(req.user.id);
    res.status(200).json({ success: true, count: myAssets.length, data: myAssets });
});

exports.getDepreciation = asyncHandler(async (req, res) => {
    const depreciation = await assetService.getAssetDepreciation(req.params.id);
    res.status(200).json({ success: true, data: depreciation });
});

exports.getAssetHistory = asyncHandler(async (req, res) => {
    const logs = await assetService.getAssetHistory(req.params.id);
    res.status(200).json({ success: true, data: logs });
});

exports.exportCSV = asyncHandler(async (req, res) => {
    const csv = await assetService.exportAssetsCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
    res.status(200).send(csv);
});

exports.getLicenseSummary = asyncHandler(async (req, res) => {
    const summary = await assetService.getLicenseSummary();
    res.status(200).json({ success: true, data: summary });
});

exports.getSummary = asyncHandler(async (req, res) => {
    const summary = await assetService.getAssetSummary();
    res.status(200).json({ success: true, data: summary });
});

exports.addAttachment = asyncHandler(async (req, res, next) => {
    try {
        const doc = await assetService.addAssetAttachment(req.params.id, req.body, req.user.id);
        res.status(201).json({ success: true, data: doc });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.removeAttachment = asyncHandler(async (req, res, next) => {
    try {
        const result = await assetService.removeAssetAttachment(req.params.id, req.params.documentId, req.user.id);
        res.json({ success: true, ...result });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});
