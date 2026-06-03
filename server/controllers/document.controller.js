const https = require('https');
const asyncHandler = require('../utils/asyncHandler');
const docService = require('../services/documentService');

// ─── Folders ──────────────────────────────────────────

exports.createFolder = asyncHandler(async (req, res) => {
    const folder = await docService.createFolder(req.body, req.user._id);
    res.status(201).json({ success: true, data: folder });
});

exports.getAllFolders = asyncHandler(async (req, res) => {
    const data = await docService.getAllFolders();
    res.json({ success: true, data });
});

exports.getFolderById = asyncHandler(async (req, res) => {
    const result = await docService.getFolderById(req.params.id);
    res.json({ success: true, ...result });
});

exports.updateFolder = asyncHandler(async (req, res) => {
    const folder = await docService.updateFolder(req.params.id, req.body);
    res.json({ success: true, data: folder });
});

exports.deleteFolder = asyncHandler(async (req, res) => {
    const deleteChildren = req.query.recursive === 'true';
    await docService.deleteFolder(req.params.id, deleteChildren);
    res.json({ success: true, message: 'Folder deleted.' });
});

// ─── Documents ─────────────────────────────────────────

exports.uploadDocument = asyncHandler(async (req, res) => {
    const { title, description, fileUrl, publicId, fileSize, mimeType, category, tags, folder, acknowledgementRequired, expiryDate } = req.body;
    if (!title || !fileUrl) return res.status(400).json({ success: false, message: 'Title and file URL are required.' });
    const doc = await docService.uploadDocument({
        title, description, fileUrl, publicId, fileSize, mimeType, category, tags, folder, acknowledgementRequired, expiryDate,
    }, req.user._id, req.ip);
    res.status(201).json({ success: true, data: doc });
});

exports.getAllDocuments = asyncHandler(async (req, res) => {
    const { page, limit, folder, category, tag, search, status, sortBy, order } = req.query;
    const result = await docService.getAllDocuments({ page, limit, folder, category, tag, search, status, sortBy, order });
    res.json({ success: true, ...result });
});

exports.getMyDocuments = asyncHandler(async (req, res) => {
    const { page, limit, category, tag, search } = req.query;
    const result = await docService.getMyDocuments(req.user._id, { page, limit, category, tag, search });
    res.json({ success: true, ...result });
});

exports.getDocumentById = asyncHandler(async (req, res) => {
    const result = await docService.getDocumentById(req.params.id, req.user._id);
    res.json({ success: true, ...result });
});

exports.updateDocument = asyncHandler(async (req, res) => {
    const doc = await docService.updateDocument(req.params.id, req.body, req.user._id, req.ip);
    res.json({ success: true, data: doc });
});

exports.softDeleteDocument = asyncHandler(async (req, res) => {
    await docService.softDeleteDocument(req.params.id, req.user._id, req.ip);
    res.json({ success: true, message: 'Document deleted.' });
});

exports.restoreDocument = asyncHandler(async (req, res) => {
    const doc = await docService.restoreDocument(req.params.id, req.user._id);
    res.json({ success: true, data: doc });
});

exports.acknowledgeDocument = asyncHandler(async (req, res) => {
    const doc = await docService.acknowledgeDocument(req.params.id, req.user._id);
    res.json({ success: true, data: doc });
});

exports.downloadDocument = asyncHandler(async (req, res, next) => {
    const result = await docService.getDocumentForDownload(req.params.id, req.user._id);
    const { document: doc, secureUrl } = result;
    https.get(secureUrl, (stream) => {
        if (stream.statusCode !== 200) return res.status(404).json({ success: false, message: 'File not found on storage.' });
        res.setHeader('Content-Type', stream.headers['content-type']);
        res.setHeader('Content-Disposition', `attachment; filename="${doc.title}.pdf"`);
        stream.pipe(res);
    }).on('error', (e) => { next(e); });
});

// ─── Versions ─────────────────────────────────────────

exports.getVersions = asyncHandler(async (req, res) => {
    const versions = await docService.getVersions(req.params.id);
    res.json({ success: true, data: versions });
});

exports.restoreVersion = asyncHandler(async (req, res) => {
    const doc = await docService.restoreVersion(req.params.id, parseInt(req.params.version), req.user._id);
    res.json({ success: true, data: doc });
});

// ─── Favorites ────────────────────────────────────────

exports.toggleFavorite = asyncHandler(async (req, res) => {
    const result = await docService.toggleFavorite(req.params.id, req.user._id);
    res.json({ success: true, ...result });
});

exports.getMyFavorites = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await docService.getMyFavorites(req.user._id, { page, limit });
    res.json({ success: true, ...result });
});

// ─── Activity ─────────────────────────────────────────

exports.getDocumentActivity = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await docService.getDocumentActivity(req.params.id, { page, limit });
    res.json({ success: true, ...result });
});

// ─── Move ─────────────────────────────────────────────

exports.moveToFolder = asyncHandler(async (req, res) => {
    const doc = await docService.moveToFolder(req.params.id, req.body.folderId);
    res.json({ success: true, data: doc });
});

// ─── Bulk ─────────────────────────────────────────────

exports.bulkMove = asyncHandler(async (req, res) => {
    const { documentIds, folderId } = req.body;
    if (!documentIds?.length) return res.status(400).json({ success: false, message: 'documentIds required.' });
    const result = await docService.bulkMove(documentIds, folderId, req.user._id);
    res.json({ success: true, ...result });
});

exports.bulkDelete = asyncHandler(async (req, res) => {
    const { documentIds } = req.body;
    if (!documentIds?.length) return res.status(400).json({ success: false, message: 'documentIds required.' });
    const result = await docService.bulkDelete(documentIds, req.user._id);
    res.json({ success: true, ...result });
});

exports.bulkTag = asyncHandler(async (req, res) => {
    const { documentIds, tags, action } = req.body;
    if (!documentIds?.length || !tags?.length) return res.status(400).json({ success: false, message: 'documentIds and tags required.' });
    const result = await docService.bulkTag(documentIds, tags, action);
    res.json({ success: true, ...result });
});

// ─── Pending Acknowledgements ─────────────────────────

exports.getPendingAcknowledgements = asyncHandler(async (req, res) => {
    const data = await docService.getPendingAcknowledgements(req.user._id);
    res.json({ success: true, data });
});

// ─── Dashboard / Stats ────────────────────────────────

exports.getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await docService.getDashboardStats();
    res.json({ success: true, data: stats });
});

exports.exportDocuments = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status === 'active') filter.isActive = true;
    const csv = await docService.exportDocumentsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="documents-export.csv"');
    res.send(csv);
});
