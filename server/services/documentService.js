const Document = require('../model/Document');
const DocumentVersion = require('../model/DocumentVersion');
const DocumentActivity = require('../model/DocumentActivity');
const DocumentFavorite = require('../model/DocumentFavorite');
const DocumentFolder = require('../model/DocumentFolder');
const cloudinary = require('../config/cloudinary');
const { createNotification } = require('./notificationService');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const https = require('https');

// ─── Helpers ───────────────────────────────────────────

const recordActivity = (documentId, userId, action, metadata) =>
    DocumentActivity.create({ document: documentId, user: userId, action, metadata }).catch(e =>
        logger.error('[DocService] Failed to record activity:', e),
    );

const createVersion = async (documentId, version, fileUrl, publicId, fileSize, mimeType, uploadedBy, changeNotes) =>
    DocumentVersion.create({ document: documentId, version, fileUrl, publicId, fileSize, mimeType, uploadedBy, changeNotes });

const err = (msg, s) => { const e = new Error(msg); e.status = s; throw e; };

// ─── Folders ────────────────────────────────────────────

const createFolder = async (data, userId) => {
    if (data.parent) {
        const parent = await DocumentFolder.findById(data.parent);
        if (!parent) err('Parent folder not found.', 404);
    }
    const folder = await DocumentFolder.create({ ...data, createdBy: userId });
    return folder;
};

const getAllFolders = async () => {
    const folders = await DocumentFolder.find({ isActive: true })
        .populate('createdBy', 'name')
        .sort({ name: 1 })
        .lean();

    const map = {};
    const roots = [];
    folders.forEach(f => { map[f._id] = f; f.children = []; });
    folders.forEach(f => {
        if (f.parent && map[f.parent]) map[f.parent].children.push(f);
        else roots.push(f);
    });
    return roots;
};

const getFolderById = async (id) => {
    const folder = await DocumentFolder.findById(id).populate('createdBy', 'name');
    if (!folder) err('Folder not found.', 404);
    const children = await DocumentFolder.find({ parent: id, isActive: true }).sort({ name: 1 }).lean();
    const docs = await Document.find({ folder: id, isActive: true })
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();
    return { folder, children, documents: docs };
};

const updateFolder = async (id, updates) => {
    if (updates.parent) {
        if (updates.parent === id) err('Cannot set folder as its own parent.', 400);
        const parent = await DocumentFolder.findById(updates.parent);
        if (!parent) err('Parent folder not found.', 404);

        let current = parent;
        const visited = new Set([id]);
        while (current) {
            if (visited.has(current._id.toString())) err('Circular folder reference detected.', 400);
            visited.add(current._id.toString());
            current = current.parent ? await DocumentFolder.findById(current.parent) : null;
        }
    }
    const folder = await DocumentFolder.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!folder) err('Folder not found.', 404);
    return folder;
};

const deleteFolder = async (id, deleteChildren = false) => {
    const folder = await DocumentFolder.findById(id);
    if (!folder) err('Folder not found.', 404);

    const children = await DocumentFolder.find({ parent: id, isActive: true });
    if (children.length > 0 && !deleteChildren) {
        const e = new Error('Folder has subfolders. Set deleteChildren=true to delete recursively.');
        e.status = 400; throw e;
    }

    if (deleteChildren) {
        for (const child of children) {
            await Document.updateMany({ folder: child._id }, { folder: null });
            await DocumentFolder.findByIdAndUpdate(child._id, { isActive: false });
        }
    }

    await Document.updateMany({ folder: id }, { folder: null });
    folder.isActive = false;
    await folder.save();
    return folder;
};

// ─── Documents ──────────────────────────────────────────

const uploadDocument = async (data, userId, ip) => {
    const doc = await Document.create({ ...data, uploadedBy: userId });
    await createVersion(doc._id, 1, data.fileUrl, data.publicId, data.fileSize, data.mimeType, userId, 'Initial upload');
    await recordActivity(doc._id, userId, 'uploaded', { title: doc.title });
    await createAuditLog({
        actor: userId, action: 'DOCUMENT_UPLOADED',
        target: { id: doc._id, type: 'Document' },
        details: { title: doc.title },
        ipAddress: ip,
    });

    if (data.acknowledgementRequired) {
        try {
            await createNotification({
                recipient: userId,
                message: `Document "${doc.title}" requires acknowledgement.`,
                link: `/documents/${doc._id}`, type: 'Document',
            });
        } catch (e) { logger.error('[DocService] Ack notification failed:', e); }
    }

    return await Document.findById(doc._id).populate('uploadedBy', 'name').populate('folder', 'name');
};

const getAllDocuments = async ({ page, limit, folder, category, tag, search, status, sortBy = 'createdAt', order = 'desc' } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (folder) query.folder = folder === 'null' ? null : folder;
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (status === 'active') query.isActive = true;
    else if (status === 'expired') { query.isActive = true; query.expiryDate = { $lte: new Date() }; }
    else if (status === 'inactive') query.isActive = false;
    if (search) {
        const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
            { title: { $regex: esc, $options: 'i' } },
            { description: { $regex: esc, $options: 'i' } },
            { tags: { $regex: esc, $options: 'i' } },
        ];
    }

    const sort = { [sortBy]: order === 'desc' ? -1 : 1 };
    const [docs, total] = await Promise.all([
        Document.find(query).populate('uploadedBy', 'name').populate('folder', 'name')
            .sort(sort).skip(skip).limit(l).lean(),
        Document.countDocuments(query),
    ]);
    return { data: docs, pagination: buildPagination(total, p, l) };
};

const getMyDocuments = async (userId, { page, limit, category, tag, search } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { isActive: true };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
        const esc = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [{ title: { $regex: esc, $options: 'i' } }, { description: { $regex: esc, $options: 'i' } }];
    }

    const [docs, total] = await Promise.all([
        Document.find(query).populate('uploadedBy', 'name').populate('folder', 'name')
            .sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
        Document.countDocuments(query),
    ]);

    const favIds = await DocumentFavorite.find({ user: userId }).select('document').lean();
    const favSet = new Set(favIds.map(f => f.document.toString()));
    const enriched = docs.map(d => ({ ...d, isFavorited: favSet.has(d._id.toString()) }));
    return { data: enriched, pagination: buildPagination(total, p, l) };
};

const getDocumentById = async (id, userId) => {
    const doc = await Document.findById(id)
        .populate('uploadedBy', 'name')
        .populate('folder', 'name')
        .populate('acknowledgedBy.user', 'name');
    if (!doc || !doc.isActive) err('Document not found or is inactive.', 404);

    const versionCount = await DocumentVersion.countDocuments({ document: id });
    const isFavorited = userId ? !!(await DocumentFavorite.findOne({ user: userId, document: id })) : false;
    const hasAcknowledged = userId ? doc.acknowledgedBy.some(a => a.user._id.toString() === userId.toString()) : false;

    await recordActivity(id, userId, 'viewed', {});
    return { document: doc, versionCount, isFavorited, hasAcknowledged };
};

const updateDocument = async (id, body, userId, ip) => {
    const doc = await Document.findById(id);
    if (!doc) err('Document not found.', 404);

    const allowedFields = ['title', 'description', 'fileUrl', 'publicId', 'fileSize', 'mimeType', 'category', 'tags', 'folder', 'acknowledgementRequired', 'expiryDate'];
    const filtered = {};
    allowedFields.forEach(f => { if (body[f] !== undefined) filtered[f] = body[f]; });

    const isNewFile = filtered.fileUrl && filtered.fileUrl !== doc.fileUrl;
    let newVersion;

    if (isNewFile) {
        newVersion = doc.currentVersion + 1;
        filtered.currentVersion = newVersion;
    }

    const updated = await Document.findByIdAndUpdate(id, filtered, { new: true, runValidators: true });

    if (isNewFile) {
        await createVersion(id, newVersion, filtered.fileUrl, filtered.publicId, filtered.fileSize, filtered.mimeType, userId, body.changeNotes);
    }

    await recordActivity(id, userId, 'updated', { changes: Object.keys(filtered) });
    await createAuditLog({
        actor: userId, action: 'DOCUMENT_UPDATED',
        target: { id, type: 'Document' },
        details: { title: updated.title },
        ipAddress: ip,
    });

    return await Document.findById(id).populate('uploadedBy', 'name').populate('folder', 'name');
};

const softDeleteDocument = async (id, userId, ip) => {
    const doc = await Document.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!doc) err('Document not found.', 404);
    await recordActivity(id, userId, 'deleted', {});
    await createAuditLog({ actor: userId, action: 'DOCUMENT_DELETED', target: { id, type: 'Document' }, ipAddress: ip });
    return doc;
};

const restoreDocument = async (id, userId) => {
    const doc = await Document.findByIdAndUpdate(id, { isActive: true }, { new: true });
    if (!doc) err('Document not found.', 404);
    await recordActivity(id, userId, 'restored', {});
    return doc;
};

const acknowledgeDocument = async (id, userId) => {
    const doc = await Document.findById(id);
    if (!doc || !doc.isActive) err('Document not found or is inactive.', 404);
    if (!doc.acknowledgementRequired) err('This document does not require acknowledgement.', 400);
    if (doc.acknowledgedBy.some(a => a.user.toString() === userId.toString())) err('Already acknowledged.', 400);
    doc.acknowledgedBy.push({ user: userId });
    await doc.save();
    await recordActivity(id, userId, 'acknowledged', {});
    return doc;
};

const getDocumentForDownload = async (id, userId) => {
    const doc = await Document.findById(id);
    if (!doc || !doc.isActive) err('Document not found or is inactive.', 404);

    let secureUrl;
    if (doc.publicId) {
        secureUrl = cloudinary.url(doc.publicId, { resource_type: 'raw', sign_url: true, secure: true });
    } else {
        secureUrl = doc.fileUrl;
    }

    await recordActivity(id, userId, 'downloaded', {});
    return { document: doc, secureUrl };
};

// ─── Versions ───────────────────────────────────────────

const getVersions = async (documentId) => {
    return DocumentVersion.find({ document: documentId })
        .populate('uploadedBy', 'name')
        .sort({ version: -1 });
};

const restoreVersion = async (documentId, versionNumber, userId) => {
    const version = await DocumentVersion.findOne({ document: documentId, version: versionNumber });
    if (!version) err('Version not found.', 404);
    const doc = await Document.findById(documentId);
    if (!doc) err('Document not found.', 404);

    const newVersion = doc.currentVersion + 1;
    doc.fileUrl = version.fileUrl;
    doc.publicId = version.publicId;
    doc.fileSize = version.fileSize;
    doc.mimeType = version.mimeType;
    doc.currentVersion = newVersion;
    await doc.save();

    await createVersion(documentId, newVersion, version.fileUrl, version.publicId, version.fileSize, version.mimeType, userId, `Restored from v${versionNumber}`);
    await recordActivity(documentId, userId, 'updated', { action: 'restored_from_version', version: versionNumber });
    return doc;
};

// ─── Favorites ──────────────────────────────────────────

const toggleFavorite = async (documentId, userId) => {
    const existing = await DocumentFavorite.findOne({ user: userId, document: documentId });
    if (existing) {
        await DocumentFavorite.findByIdAndDelete(existing._id);
        return { isFavorited: false };
    }
    await DocumentFavorite.create({ user: userId, document: documentId });
    return { isFavorited: true };
};

const getMyFavorites = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [favorites, total] = await Promise.all([
        DocumentFavorite.find({ user: userId }).populate({
            path: 'document', populate: { path: 'uploadedBy', select: 'name' },
        }).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
        DocumentFavorite.countDocuments({ user: userId }),
    ]);
    const docs = favorites.map(f => f.document).filter(Boolean);
    return { data: docs, pagination: buildPagination(total, p, l) };
};

// ─── Activity ───────────────────────────────────────────

const getDocumentActivity = async (documentId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [activities, total] = await Promise.all([
        DocumentActivity.find({ document: documentId })
            .populate('user', 'name')
            .sort({ createdAt: -1 }).skip(skip).limit(l),
        DocumentActivity.countDocuments({ document: documentId }),
    ]);
    return { data: activities, pagination: buildPagination(total, p, l) };
};

// ─── Move ───────────────────────────────────────────────

const moveToFolder = async (documentId, folderId) => {
    const doc = await Document.findById(documentId);
    if (!doc) err('Document not found.', 404);
    if (folderId) {
        const folder = await DocumentFolder.findById(folderId);
        if (!folder) err('Folder not found.', 404);
    }
    doc.folder = folderId || null;
    await doc.save();
    return doc.populate('folder', 'name');
};

// ─── Bulk ───────────────────────────────────────────────

const bulkMove = async (documentIds, folderId, userId) => {
    if (folderId) {
        const folder = await DocumentFolder.findById(folderId);
        if (!folder) err('Folder not found.', 404);
    }
    await Document.updateMany({ _id: { $in: documentIds }, isActive: true }, { folder: folderId || null });
    await Promise.all(documentIds.map(id => recordActivity(id, userId, 'updated', { action: 'bulk_moved' })));
    return { moved: documentIds.length };
};

const bulkDelete = async (documentIds, userId) => {
    await Document.updateMany({ _id: { $in: documentIds }, isActive: true }, { isActive: false });
    await Promise.all(documentIds.map(id => recordActivity(id, userId, 'deleted', { action: 'bulk_deleted' })));
    return { deleted: documentIds.length };
};

const bulkTag = async (documentIds, tags, action = 'add') => {
    if (action === 'add') {
        await Document.updateMany(
            { _id: { $in: documentIds }, isActive: true },
            { $addToSet: { tags: { $each: tags } } },
        );
    } else {
        await Document.updateMany(
            { _id: { $in: documentIds }, isActive: true },
            { $pull: { tags: { $in: tags } } },
        );
    }
    return { tagged: documentIds.length };
};

// ─── Pending Acknowledgements ───────────────────────────

const getPendingAcknowledgements = async (userId) => {
    const docs = await Document.find({
        acknowledgementRequired: true, isActive: true,
        'acknowledgedBy.user': { $ne: userId },
    }).populate('uploadedBy', 'name').lean();

    const now = new Date();
    const docsWithAck = await Promise.all(docs.map(async d => {
        const hasAcked = d.acknowledgedBy.some(a => a.user?.toString() === userId.toString());
        return hasAcked ? null : { ...d, isExpired: d.expiryDate && now > d.expiryDate };
    }));
    return docsWithAck.filter(Boolean);
};

const sendAckReminders = async () => {
    const docs = await Document.find({ acknowledgementRequired: true, isActive: true })
        .populate('uploadedBy', 'name').lean();
    const User = require('../model/user');
    const allUsers = await User.find({ isActive: true }).select('_id name').lean();
    let sent = 0;

    for (const doc of docs) {
        const ackedIds = new Set(doc.acknowledgedBy.map(a => a.user.toString()));
        const pending = allUsers.filter(u => !ackedIds.has(u._id.toString()));

        for (const user of pending) {
            try {
                await createNotification({
                    recipient: user._id, sender: doc.uploadedBy?._id || null,
                    message: `Reminder: Please acknowledge "${doc.title}".`,
                    link: `/documents/${doc._id}`, type: 'Document',
                });
                sent++;
            } catch (e) { logger.error('[DocService] Ack reminder failed:', e); }
        }
    }
    return sent;
};

// ─── Dashboard / Stats ─────────────────────────────────

const getDashboardStats = async () => {
    const now = new Date();
    const [totalDocs, activeDocs, expiredDocs, pendingAckDocs, categoryCounts, recentUploads] = await Promise.all([
        Document.countDocuments(),
        Document.countDocuments({ isActive: true }),
        Document.countDocuments({ isActive: true, expiryDate: { $lte: now } }),
        Document.countDocuments({ acknowledgementRequired: true, isActive: true }),
        Document.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        Document.find({ isActive: true }).populate('uploadedBy', 'name')
            .sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    return { totalDocs, activeDocs, expiredDocs, pendingAckDocs, categoryCounts, recentUploads };
};

const exportDocumentsCSV = async (filter = {}) => {
    const docs = await Document.find(filter)
        .populate('uploadedBy', 'name')
        .populate('folder', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Title,Category,Tags,Folder,Uploaded By,File URL,Version,Requires Ack,Expiry Date,Created At\n';
    const rows = docs.map(d =>
        `"${(d.title || '').replace(/"/g, '""')}",${d.category || ''},"${(d.tags || []).join('; ')}","${d.folder?.name || ''}","${d.uploadedBy?.name || ''}",${d.fileUrl || ''},${d.currentVersion || 1},${d.acknowledgementRequired ? 'Yes' : 'No'},${d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : ''},${new Date(d.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    createFolder, getAllFolders, getFolderById, updateFolder, deleteFolder,
    uploadDocument, getAllDocuments, getMyDocuments, getDocumentById,
    updateDocument, softDeleteDocument, restoreDocument,
    acknowledgeDocument, getDocumentForDownload,
    getVersions, restoreVersion,
    toggleFavorite, getMyFavorites,
    getDocumentActivity,
    moveToFolder, bulkMove, bulkDelete, bulkTag,
    getPendingAcknowledgements, sendAckReminders,
    getDashboardStats, exportDocumentsCSV,
};
