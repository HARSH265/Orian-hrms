const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { featureEnabled } = require('../middleware/featureToggle');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    createFolder, getAllFolders, getFolderById, updateFolder, deleteFolder,
    uploadDocument, getAllDocuments, getMyDocuments, getDocumentById,
    updateDocument, softDeleteDocument, restoreDocument,
    acknowledgeDocument, downloadDocument, getVersions, restoreVersion,
    toggleFavorite, getMyFavorites, getDocumentActivity,
    moveToFolder, bulkMove, bulkDelete, bulkTag,
    getPendingAcknowledgements, getDashboardStats, exportDocuments,
} = require('../controllers/document.controller');

const router = express.Router();

router.use(protect);
router.use(featureEnabled('documentManagement'));

// ─── Static routes ────────────────────────────────────────
router.get('/export', checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), exportDocuments);
router.get('/my-documents', getMyDocuments);
router.get('/my-favorites', getMyFavorites);
router.get('/pending-acknowledgements', getPendingAcknowledgements);
router.get('/dashboard/stats', checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), getDashboardStats);
router.get('/download/:id', downloadDocument);
router.post('/bulk/move', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), bulkMove);
router.post('/bulk/delete', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), bulkDelete);
router.post('/bulk/tag', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), bulkTag);

router.route('/')
    .post(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), uploadDocument)
    .get(checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), getAllDocuments);

// ─── Folders ──────────────────────────────────────────────
router.route('/folders')
    .post(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), createFolder)
    .get(getAllFolders);

router.route('/folders/:id')
    .get(getFolderById)
    .put(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), updateFolder)
    .delete(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), deleteFolder);

// ─── Param routes ─────────────────────────────────────────
router.get('/:id', getDocumentById);
router.put('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), updateDocument);
router.delete('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), softDeleteDocument);

router.put('/:id/restore', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), restoreDocument);
router.post('/:id/acknowledge', writeLimiter, acknowledgeDocument);
router.put('/:id/move', writeLimiter, moveToFolder);
router.post('/:id/favorite', writeLimiter, toggleFavorite);
router.get('/:id/versions', getVersions);
router.post('/:id/versions/:version/restore', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_DOCUMENTS), restoreVersion);
router.get('/:id/activity', getDocumentActivity);

module.exports = router;
