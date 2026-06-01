const https = require('https');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const {
    uploadDocument,
    getAllDocuments,
    getMyDocuments,
    getDocumentById,
    updateDocument,
    softDeleteDocument,
    acknowledgeDocument,
    getDocumentForDownload,
} = require('../services/documentService');

exports.uploadDocument = asyncHandler(async (req, res, next) => {
    try {
        const { title, description, fileUrl, category, acknowledgementRequired } = req.body;

        if (!title || !fileUrl) {
            return res.status(400).json({ success: false, message: 'Title and file URL are required.' });
        }

        const document = await uploadDocument({
            title,
            description,
            fileUrl,
            category,
            acknowledgementRequired,
            uploadedBy: req.user._id,
        });

        res.status(201).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
});

exports.getAllDocuments = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getAllDocuments({ page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.getMyDocuments = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getMyDocuments({ page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

exports.getDocumentById = asyncHandler(async (req, res, next) => {
    try {
        const document = await getDocumentById(req.params.id);
        if (!document || !document.isActive) {
            return res.status(404).json({ success: false, message: 'Document not found or is inactive.' });
        }
        res.status(200).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
});

exports.updateDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await updateDocument(req.params.id, req.body);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        res.status(200).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
});

exports.softDeleteDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await softDeleteDocument(req.params.id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
});

exports.acknowledgeDocument = asyncHandler(async (req, res, next) => {
    try {
        const result = await acknowledgeDocument(req.params.id, req.user._id);
        if (result.error) {
            return res.status(result.status).json({ success: false, message: result.error });
        }
        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        next(error);
    }
});

exports.downloadDocument = asyncHandler(async (req, res, next) => {
    try {
        const result = await getDocumentForDownload(req.params.id);
        if (result.error) {
            return res.status(result.status).json({ success: false, message: result.error });
        }

        const { document, secureUrl } = result;

        https.get(secureUrl, (stream) => {
            if (stream.statusCode !== 200) {
                return res.status(404).json({ success: false, message: 'File not found on the storage server.' });
            }
            res.setHeader('Content-Type', stream.headers['content-type']);
            res.setHeader('Content-Disposition', `attachment; filename="${document.title}.pdf"`);
            stream.pipe(res);
        }).on('error', (e) => {
            next(e);
        });
    } catch (error) {
        logger.error("Error in downloadDocument:", error);
        next(error);
    }
});

module.exports = {
    uploadDocument: exports.uploadDocument,
    getAllDocuments: exports.getAllDocuments,
    getMyDocuments: exports.getMyDocuments,
    getDocumentById: exports.getDocumentById,
    updateDocument: exports.updateDocument,
    softDeleteDocument: exports.softDeleteDocument,
    acknowledgeDocument: exports.acknowledgeDocument,
    downloadDocument: exports.downloadDocument,
};
