const assetRequestService = require('../services/assetRequestService');
const asyncHandler = require('../utils/asyncHandler');

exports.createRequest = asyncHandler(async (req, res) => {
    const request = await assetRequestService.createRequest(req.body, req.user.id);
    res.status(201).json({ success: true, data: request });
});

exports.getMyRequests = asyncHandler(async (req, res) => {
    const requests = await assetRequestService.getMyRequests(req.user.id, req.query);
    res.status(200).json({ success: true, count: requests.length, data: requests });
});

exports.getAllRequests = asyncHandler(async (req, res) => {
    const requests = await assetRequestService.getAllRequests(req.query);
    res.status(200).json({ success: true, count: requests.length, data: requests });
});

exports.approveRequest = asyncHandler(async (req, res) => {
    const request = await assetRequestService.approveRequest(req.params.id, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Request approved.', data: request });
});

exports.rejectRequest = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const request = await assetRequestService.rejectRequest(req.params.id, req.user.id, reason, req.ip);
    res.status(200).json({ success: true, message: 'Request rejected.', data: request });
});

exports.fulfillRequest = asyncHandler(async (req, res) => {
    const { assetId } = req.body;
    const request = await assetRequestService.fulfillRequest(req.params.id, assetId, req.user.id, req.ip);
    res.status(200).json({ success: true, message: 'Request fulfilled.', data: request });
});
