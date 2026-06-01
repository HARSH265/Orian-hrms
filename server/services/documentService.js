const Document = require('../model/Document');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const uploadDocument = async (data) => {
    const document = await Document.create(data);
    return document;
};

const getAllDocuments = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [documents, total] = await Promise.all([
        Document.find()
            .populate('uploadedBy', 'name')
            .populate('acknowledgedBy.user', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Document.countDocuments()
    ]);
    return { data: documents, pagination: buildPagination(total, p, l) };
};

const getMyDocuments = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [documents, total] = await Promise.all([
        Document.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(l),
        Document.countDocuments({ isActive: true })
    ]);
    return { data: documents, pagination: buildPagination(total, p, l) };
};

const getDocumentById = async (id) => {
    const document = await Document.findById(id)
        .populate('uploadedBy', 'name')
        .populate('acknowledgedBy.user', 'name');
    return document;
};

const updateDocument = async (id, body) => {
    // Whitelist allowed fields
    const allowedFields = ['title', 'description', 'fileUrl', 'category', 'acknowledgementRequired'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (body[field] !== undefined) {
            filteredUpdates[field] = body[field];
        }
    });
    const document = await Document.findByIdAndUpdate(id, filteredUpdates, {
        new: true,
        runValidators: true,
    });
    return document;
};

const softDeleteDocument = async (id) => {
    const document = await Document.findByIdAndUpdate(id, { isActive: false }, { new: true });
    return document;
};

const acknowledgeDocument = async (id, userId) => {
    const document = await Document.findById(id);

    if (!document || !document.isActive) {
        return { error: 'Document not found or is inactive.', status: 404 };
    }

    if (!document.acknowledgementRequired) {
        return { error: 'This document does not require acknowledgement.', status: 400 };
    }

    const alreadyAcknowledged = document.acknowledgedBy.some(ack => ack.user.equals(userId));
    if (alreadyAcknowledged) {
        return { error: 'You have already acknowledged this document.', status: 400 };
    }

    document.acknowledgedBy.push({ user: userId });
    await document.save();

    return { data: document };
};

const getDocumentForDownload = async (id) => {
    const document = await Document.findById(id);

    if (!document || !document.isActive) {
        return { error: 'Document not found or is inactive.', status: 404 };
    }

    const urlParts = document.fileUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const public_id = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    const folder = urlParts[urlParts.length - 2];
    const fullPublicId = `${folder}/${public_id}`;

    const secureUrl = cloudinary.url(fullPublicId, {
        resource_type: 'raw',
        sign_url: true,
        secure: true,
    });

    return { document, secureUrl };
};

module.exports = {
    uploadDocument,
    getAllDocuments,
    getMyDocuments,
    getDocumentById,
    updateDocument,
    softDeleteDocument,
    acknowledgeDocument,
    getDocumentForDownload,
};
