const Asset = require('../model/asset.model');
const AssetLog = require('../model/assetLog.model');
const Document = require('../model/Document');
const DocumentVersion = require('../model/DocumentVersion');
const { createAuditLog } = require('./auditLogService');

const getAllAssets = async (queryParams) => {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.assetType) filter.assetType = queryParams.assetType;
    if (queryParams.search) filter.name = { $regex: queryParams.search, $options: 'i' };

    const [assets, total] = await Promise.all([
        Asset.find(filter)
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Asset.countDocuments(filter),
    ]);
    return { assets, total, page, pages: Math.ceil(total / limit) };
};

const getAssetById = async (id) => {
    const asset = await Asset.findById(id).populate('assignedTo', 'name email').populate('attachments', 'title fileUrl mimeType fileSize createdAt');
    return asset;
};

const createAsset = async (data, userId, ip) => {
    let attachmentDocs = [];
    if (data.attachments?.length) {
        attachmentDocs = await Promise.all(
            data.attachments.map(att => Document.create({
                title: att.title || `Attachment for ${data.name}`,
                fileUrl: att.fileUrl,
                publicId: att.publicId,
                fileSize: att.fileSize,
                mimeType: att.mimeType,
                category: 'Asset Attachment',
                uploadedBy: userId,
            }).then(doc => {
                DocumentVersion.create({ document: doc._id, version: 1, fileUrl: att.fileUrl, publicId: att.publicId, fileSize: att.fileSize, mimeType: att.mimeType, uploadedBy: userId, changeNotes: 'Asset attachment' }).catch(() => {});
                return doc._id;
            }))
        );
        data.attachments = attachmentDocs;
    }
    const asset = await Asset.create(data);
    await AssetLog.create({ asset: asset._id, action: 'created', performedBy: userId });
    await createAuditLog({
        actor: userId, action: 'ASSET_CREATED',
        target: { id: asset._id, type: 'Asset' },
        details: { name: asset.name, serialNumber: asset.serialNumber, attachments: attachmentDocs.length },
        ipAddress: ip,
    });
    return asset.populate('assignedTo', 'name email').populate('attachments');
};

const updateAsset = async (id, data, userId, ip) => {
    const oldAsset = await Asset.findById(id);
    if (!oldAsset) {
        const err = new Error('Asset not found');
        err.status = 404;
        throw err;
    }

    // License seat tracking
    if (oldAsset.assetType === 'License' && oldAsset.seatsTotal > 0 && data.assignedTo !== undefined) {
        const isAssigning = data.assignedTo && !oldAsset.assignedTo;
        const isUnassigning = !data.assignedTo && oldAsset.assignedTo;
        if (isAssigning && oldAsset.seatsUsed >= oldAsset.seatsTotal) {
            const err = new Error(`All ${oldAsset.seatsTotal} seat(s) for "${oldAsset.name}" are in use.`);
            err.status = 400;
            throw err;
        }
        data.seatsUsed = oldAsset.seatsUsed + (isAssigning ? 1 : isUnassigning ? -1 : 0);
    }

    if (data.assignedTo) data.status = 'Assigned';
    else if (data.assignedTo === null) data.status = 'Available';

    const asset = await Asset.findByIdAndUpdate(id, data, { new: true, runValidators: true });

    const logs = [];
    if (oldAsset.assignedTo?.toString() !== asset.assignedTo?.toString()) {
        if (asset.assignedTo) {
            logs.push({ asset: asset._id, action: 'assigned', previousValue: oldAsset.assignedTo, newValue: asset.assignedTo, performedBy: userId });
        } else {
            logs.push({ asset: asset._id, action: 'unassigned', previousValue: oldAsset.assignedTo, performedBy: userId });
        }
    }
    if (oldAsset.status !== asset.status) {
        logs.push({ asset: asset._id, action: 'status_changed', previousValue: oldAsset.status, newValue: asset.status, performedBy: userId });
    }
    if (logs.length > 0) await AssetLog.insertMany(logs);

    await createAuditLog({
        actor: userId, action: 'ASSET_UPDATED',
        target: { id: asset._id, type: 'Asset' },
        details: { name: asset.name, updatedFields: Object.keys(data) },
        ipAddress: ip,
    });
    return asset.populate('assignedTo', 'name email');
};

const deleteAsset = async (id, userId) => {
    const asset = await Asset.findById(id);
    if (!asset) {
        const err = new Error('Asset not found');
        err.status = 404;
        throw err;
    }
    if (asset.status === 'Assigned') {
        const err = new Error('Cannot delete an asset that is currently assigned. Please unassign it first.');
        err.status = 400;
        throw err;
    }
    await Asset.findByIdAndDelete(id);
    await createAuditLog({
        actor: userId, action: 'ASSET_DELETED',
        target: { id: asset._id, type: 'Asset' },
        details: { name: asset.name },
    });
    return { message: 'Asset deleted' };
};

const getMyAssets = async (userId) => {
    const myAssets = await Asset.find({ assignedTo: userId }).populate('assignedTo', 'name email');
    return myAssets;
};

const getLicenseSummary = async () => {
    const licenses = await Asset.find({ assetType: 'License' }).select('name seatsTotal seatsUsed licenseExpiryDate status').lean();
    const totalSeats = licenses.reduce((s, l) => s + (l.seatsTotal || 0), 0);
    const usedSeats = licenses.reduce((s, l) => s + (l.seatsUsed || 0), 0);
    const expiringSoon = licenses.filter(l => l.licenseExpiryDate && new Date(l.licenseExpiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    return { licenses, totalSeats, usedSeats, availableSeats: totalSeats - usedSeats, utilization: totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0, expiringSoon: expiringSoon.length };
};

const exportAssetsCSV = async (queryParams) => {
    const filter = {};
    if (queryParams.status) filter.status = queryParams.status;
    if (queryParams.assetType) filter.assetType = queryParams.assetType;
    const assets = await Asset.find(filter)
        .populate('assignedTo', 'name email')
        .populate('custodian', 'name')
        .sort({ createdAt: -1 })
        .lean();
    const header = 'Name,Type,Serial Number,Status,Assigned To,Location,Purchase Date,Warranty End,Purchase Price\n';
    const rows = assets.map(a => {
        const assigned = a.assignedTo ? `${a.assignedTo.name} (${a.assignedTo.email})` : '';
        const purDate = a.purchaseDate ? new Date(a.purchaseDate).toISOString().split('T')[0] : '';
        const warDate = a.warrantyEndDate ? new Date(a.warrantyEndDate).toISOString().split('T')[0] : '';
        return `"${a.name}",${a.assetType},${a.serialNumber || ''},${a.status},"${assigned}",${a.location || ''},${purDate},${warDate},${a.purchasePrice || 0}`;
    }).join('\n');
    return header + rows;
};

const getAssetDepreciation = async (assetId) => {
    const asset = await Asset.findById(assetId).select('name purchasePrice salvageValue purchaseDate assetType');
    if (!asset) {
        const err = new Error('Asset not found');
        err.status = 404;
        throw err;
    }
    if (!asset.purchasePrice || !asset.purchaseDate) {
        return { asset: asset.name, message: 'Purchase price or date not set. Cannot calculate depreciation.' };
    }
    const usefulLifeYears = asset.assetType === 'Hardware' ? 5 : asset.assetType === 'Software' ? 3 : 7;
    const purchasedAt = new Date(asset.purchaseDate).getTime();
    const now = Date.now();
    const elapsedYears = (now - purchasedAt) / (365.25 * 24 * 60 * 60 * 1000);
    const depreciableAmount = asset.purchasePrice - (asset.salvageValue || 0);
    const annualDepreciation = usefulLifeYears > 0 ? depreciableAmount / usefulLifeYears : 0;
    const accumulatedDepreciation = Math.min(annualDepreciation * elapsedYears, depreciableAmount);
    const bookValue = Math.max(asset.purchasePrice - accumulatedDepreciation, asset.salvageValue || 0);

    return {
        asset: asset.name,
        purchasePrice: asset.purchasePrice,
        salvageValue: asset.salvageValue || 0,
        usefulLifeYears,
        annualDepreciation: Math.round(annualDepreciation * 100) / 100,
        accumulatedDepreciation: Math.round(accumulatedDepreciation * 100) / 100,
        bookValue: Math.round(bookValue * 100) / 100,
    };
};

const addAssetAttachment = async (assetId, attachmentData, userId) => {
    const asset = await Asset.findById(assetId);
    if (!asset) { const err = new Error('Asset not found'); err.status = 404; throw err; }

    const doc = await Document.create({
        title: attachmentData.title || `Attachment for ${asset.name}`,
        fileUrl: attachmentData.fileUrl,
        publicId: attachmentData.publicId,
        fileSize: attachmentData.fileSize,
        mimeType: attachmentData.mimeType,
        category: 'Asset Attachment',
        uploadedBy: userId,
    });
    DocumentVersion.create({ document: doc._id, version: 1, fileUrl: attachmentData.fileUrl, publicId: attachmentData.publicId, fileSize: attachmentData.fileSize, mimeType: attachmentData.mimeType, uploadedBy: userId, changeNotes: 'Asset attachment' }).catch(() => {});

    asset.attachments.push(doc._id);
    await asset.save();
    await AssetLog.create({ asset: asset._id, action: 'attachment_added', newValue: doc._id, performedBy: userId });
    return doc;
};

const removeAssetAttachment = async (assetId, documentId, userId) => {
    const asset = await Asset.findById(assetId);
    if (!asset) { const err = new Error('Asset not found'); err.status = 404; throw err; }

    const idx = asset.attachments.findIndex(a => a.toString() === documentId);
    if (idx === -1) { const err = new Error('Attachment not found on this asset.'); err.status = 404; throw err; }

    asset.attachments.splice(idx, 1);
    await asset.save();
    await Document.findByIdAndUpdate(documentId, { isActive: false });
    await AssetLog.create({ asset: asset._id, action: 'attachment_removed', previousValue: documentId, performedBy: userId });
    return { message: 'Attachment removed.' };
};

const getAssetHistory = async (assetId) => {
    const logs = await AssetLog.find({ asset: assetId })
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(50);
    return logs;
};

const getAssetSummary = async () => {
    const [total, available, assigned, inRepair, retired] = await Promise.all([
        Asset.countDocuments(),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Assigned' }),
        Asset.countDocuments({ status: 'In Repair' }),
        Asset.countDocuments({ status: 'Retired' }),
    ]);
    const byType = await Asset.aggregate([
        { $group: { _id: '$assetType', count: { $sum: 1 } } },
    ]);
    return { total, available, assigned, inRepair, retired, byType };
};

module.exports = {
    getAllAssets,
    getAssetById,
    createAsset,
    updateAsset,
    deleteAsset,
    getMyAssets,
    exportAssetsCSV,
    getAssetDepreciation,
    getLicenseSummary,
    getAssetHistory,
    getAssetSummary,
    addAssetAttachment,
    removeAssetAttachment,
};
