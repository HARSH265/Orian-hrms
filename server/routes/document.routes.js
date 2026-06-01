const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    updateDocument,
    softDeleteDocument,
    acknowledgeDocument,
    getMyDocuments,
    downloadDocument,
} = require('../controllers/document.controller');

const router = express.Router();



// All routes below are protected
router.use(protect);

// Admin-only routes for managing documents
router.route('/')
    .post(checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), uploadDocument)
    .get(checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), getAllDocuments);

// Route for all employees to see their relevant documents
router.get('/my-documents', getMyDocuments);

router.get('/download/:id', downloadDocument);

router.route('/:id')
    .get(getDocumentById) // Any authenticated user can view a document's details
    .put(checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), updateDocument)
    .delete(checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), softDeleteDocument);

// Route for an employee to acknowledge a document
router.post('/:id/acknowledge', acknowledgeDocument);

module.exports = router;