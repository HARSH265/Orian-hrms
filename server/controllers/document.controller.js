const Document = require('../model/Document');
const User = require('../model/user'); 
const cloudinary = require('../config/cloudinary');
const https = require('https');
const asyncHandler = require('../utils/asyncHandler');
// @desc    Upload a new document
// @route   POST /api/documents
// @access  Private/Admin
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    try {
        const { title, description, fileUrl, category, acknowledgementRequired } = req.body;

        if (!title || !fileUrl) {
            return res.status(400).json({ success: false, message: 'Title and file URL are required.' });
        }

        const document = await Document.create({
            title,
            description,
            fileUrl,
            category,
            acknowledgementRequired,
            uploadedBy: req.user._id,
        });

        // Future enhancement: Notify all users about a new important policy.

        res.status(201).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get all documents (for admin view, includes inactive)
// @route   GET /api/documents
// @access  Private/Admin
exports.getAllDocuments = asyncHandler(async (req, res, next) => {
    try {
        const documents = await Document.find()
            .populate('uploadedBy', 'name')
            .populate('acknowledgedBy.user', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get all active documents for the logged-in employee
// @route   GET /api/documents/my-documents
// @access  Private
exports.getMyDocuments = asyncHandler(async (req, res, next) => {
    try {
        const documents = await Document.find({ isActive: true }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: documents.length, data: documents });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get a single document by ID
// @route   GET /api/documents/:id
// @access  Private
exports.getDocumentById = asyncHandler(async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('uploadedBy', 'name')
            .populate('acknowledgedBy.user', 'name');

        if (!document || !document.isActive) {
            return res.status(404).json({ success: false, message: 'Document not found or is inactive.' });
        }
        res.status(200).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
    });

// @desc    Update document details
// @route   PUT /api/documents/:id
// @access  Private/Admin
exports.updateDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await Document.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        res.status(200).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
    });

// @desc    Soft delete a document by setting isActive to false
// @route   DELETE /api/documents/:id
// @access  Private/Admin
exports.softDeleteDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await Document.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found.' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
    });

// @desc    Acknowledge a document
// @route   POST /api/documents/:id/acknowledge
// @access  Private
exports.acknowledgeDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document || !document.isActive) {
            return res.status(404).json({ success: false, message: 'Document not found or is inactive.' });
        }

        if (!document.acknowledgementRequired) {
            return res.status(400).json({ success: false, message: 'This document does not require acknowledgement.' });
        }

        // Check if user has already acknowledged
        const alreadyAcknowledged = document.acknowledgedBy.some(ack => ack.user.equals(req.user._id));
        if (alreadyAcknowledged) {
            return res.status(400).json({ success: false, message: 'You have already acknowledged this document.' });
        }

        document.acknowledgedBy.push({ user: req.user._id });
        await document.save();

        res.status(200).json({ success: true, data: document });
    } catch (error) {
        next(error);
    }
    });

// @desc    Securely stream a document for download
// @route   GET /api/documents/download/:id
// @access  Private
exports.downloadDocument = asyncHandler(async (req, res, next) => {
    try {
        const document = await Document.findById(req.params.id);

        if (!document || !document.isActive) {
            return res.status(404).json({ success: false, message: 'Document not found or is inactive.' });
        }

        const urlParts = document.fileUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const public_id = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
        const folder = urlParts[urlParts.length - 2];
        const fullPublicId = `${folder}/${public_id}`;

        // --- THIS IS THE FINAL, CORRECTED LOGIC ---
        // We use the primary .url() method and explicitly tell it to sign.
        // This is the most reliable way to generate a signed URL for a specific resource.
        const secureUrl = cloudinary.url(fullPublicId, {
            resource_type: 'raw', // Critical for non-image files like PDFs.
            sign_url: true, // Tell Cloudinary to generate a signature.
            secure: true, // Force HTTPS.
            // No expires_at needed here, as sign_url creates a short-lived signature by default.
        });
        
        https.get(secureUrl, (stream) => {
            if (stream.statusCode !== 200) {
                // This will catch if the file is truly gone from Cloudinary
                return res.status(404).json({ success: false, message: 'File not found on the storage server.' });
            }
            res.setHeader('Content-Type', stream.headers['content-type']);
            // Use 'attachment' to suggest a download, but browsers will still open PDFs inline.
            res.setHeader('Content-Disposition', `attachment; filename="${document.title}.pdf"`);
            stream.pipe(res);
        }).on('error', (e) => {
            next(e);
        });

    } catch (error) {
        console.error("Error in downloadDocument:", error);
        next(error);
    }
    });




// Don't forget to export all the functions
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