const AssetRequest = require('../model/assetRequest.model');
const Asset = require('../model/asset.model');
const { createAuditLog } = require('./auditLogService');
const { createNotification } = require('./notificationService');

const createRequest = async (data, userId) => {
    const request = await AssetRequest.create({ ...data, employee: userId });
    return request.populate('employee', 'name email');
};

const getMyRequests = async (userId, queryParams) => {
    const filter = { employee: userId };
    if (queryParams.status) filter.status = queryParams.status;
    const requests = await AssetRequest.find(filter)
        .populate('employee', 'name email')
        .populate('reviewedBy', 'name')
        .populate('fulfilledBy', 'name')
        .populate('linkedAsset', 'name serialNumber')
        .sort({ createdAt: -1 });
    return requests;
};

const getAllRequests = async (queryParams) => {
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;
    const requests = await AssetRequest.find(filter)
        .populate('employee', 'name email')
        .populate('reviewedBy', 'name')
        .populate('fulfilledBy', 'name')
        .populate('linkedAsset', 'name serialNumber')
        .sort({ createdAt: -1 });
    return requests;
};

const approveRequest = async (requestId, reviewerId, ip) => {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
        const err = new Error('Asset request not found');
        err.status = 404;
        throw err;
    }
    if (request.status !== 'Pending') {
        const err = new Error('Request has already been processed');
        err.status = 400;
        throw err;
    }
    request.status = 'Approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    await request.save();

    await createAuditLog({
        actor: reviewerId, action: 'ASSET_REQUEST_APPROVED',
        target: { id: request._id, type: 'AssetRequest' },
        details: { employee: request.employee, assetType: request.assetType },
        ipAddress: ip,
    });
    await createNotification({
        recipient: request.employee, sender: reviewerId,
        message: `Your asset request for "${request.assetType}" has been approved.`,
        link: '/assets/my-requests', type: 'Asset',
    }, {});
    return request.populate('employee', 'name email');
};

const rejectRequest = async (requestId, reviewerId, reason, ip) => {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
        const err = new Error('Asset request not found');
        err.status = 404;
        throw err;
    }
    if (request.status !== 'Pending') {
        const err = new Error('Request has already been processed');
        err.status = 400;
        throw err;
    }
    request.status = 'Rejected';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.rejectionReason = reason;
    await request.save();

    await createAuditLog({
        actor: reviewerId, action: 'ASSET_REQUEST_REJECTED',
        target: { id: request._id, type: 'AssetRequest' },
        details: { employee: request.employee, reason },
        ipAddress: ip,
    });
    await createNotification({
        recipient: request.employee, sender: reviewerId,
        message: `Your asset request for "${request.assetType}" was rejected: ${reason}`,
        link: '/assets/my-requests', type: 'Asset',
    }, {});
    return request.populate('employee', 'name email');
};

const fulfillRequest = async (requestId, assetId, fulfillorId, ip) => {
    const request = await AssetRequest.findById(requestId);
    if (!request) {
        const err = new Error('Asset request not found');
        err.status = 404;
        throw err;
    }
    if (request.status !== 'Approved') {
        const err = new Error('Only approved requests can be fulfilled');
        err.status = 400;
        throw err;
    }
    const asset = await Asset.findById(assetId);
    if (!asset) {
        const err = new Error('Asset not found');
        err.status = 404;
        throw err;
    }
    if (asset.status !== 'Available') {
        const err = new Error('Asset is not available');
        err.status = 400;
        throw err;
    }
    asset.assignedTo = request.employee;
    asset.status = 'Assigned';
    await asset.save();

    request.status = 'Fulfilled';
    request.fulfilledBy = fulfillorId;
    request.fulfilledAt = new Date();
    request.linkedAsset = assetId;
    await request.save();

    await createAuditLog({
        actor: fulfillorId, action: 'ASSET_REQUEST_FULFILLED',
        target: { id: request._id, type: 'AssetRequest' },
        details: { asset: asset.name, employee: request.employee },
        ipAddress: ip,
    });
    return request.populate('employee', 'name email').populate('linkedAsset', 'name serialNumber');
};

module.exports = {
    createRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest, fulfillRequest,
};
