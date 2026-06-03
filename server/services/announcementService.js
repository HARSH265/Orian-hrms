const Announcement = require('../model/announcement.model');
const { createAuditLog } = require('./auditLogService');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getPublishedAnnouncements = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [announcements, total] = await Promise.all([
        Announcement.find({ status: 'Published' })
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Announcement.countDocuments({ status: 'Published' }),
    ]);
    return { data: announcements, pagination: buildPagination(total, p, l) };
};

const getAllAnnouncements = async ({ page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (status) query.status = status;
    const [announcements, total] = await Promise.all([
        Announcement.find(query)
            .populate('author', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Announcement.countDocuments(query),
    ]);
    return { data: announcements, pagination: buildPagination(total, p, l) };
};

const createAnnouncement = async (data, userId, ip) => {
    const announcement = await Announcement.create(data);
    await createAuditLog({
        actor: userId, action: 'ANNOUNCEMENT_CREATED',
        target: { id: announcement._id, type: 'Announcement' },
        details: { title: announcement.title },
        ipAddress: ip,
    });
    return announcement;
};

const getAnnouncementById = async (id) => {
    const announcement = await Announcement.findById(id).populate('author', 'name');
    if (!announcement) {
        const err = new Error('Announcement not found.');
        err.status = 404;
        throw err;
    }
    return announcement;
};

const updateAnnouncement = async (id, data, userId, ip) => {
    const allowedFields = ['title', 'content', 'status'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (data[field] !== undefined) filteredUpdates[field] = data[field];
    });
    const announcement = await Announcement.findByIdAndUpdate(id, filteredUpdates, { new: true, runValidators: true });
    if (!announcement) {
        const err = new Error('Announcement not found.');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'ANNOUNCEMENT_UPDATED',
        target: { id, type: 'Announcement' },
        details: { updates: filteredUpdates },
        ipAddress: ip,
    });
    return announcement;
};

const deleteAnnouncement = async (id, userId, ip) => {
    const announcement = await Announcement.findByIdAndDelete(id);
    if (!announcement) {
        const err = new Error('Announcement not found.');
        err.status = 404;
        throw err;
    }
    await createAuditLog({
        actor: userId, action: 'ANNOUNCEMENT_DELETED',
        target: { id, type: 'Announcement' },
        details: { title: announcement.title },
        ipAddress: ip,
    });
    return announcement;
};

const checkOwnership = (announcement, loggedInUser) => {
    const authorId = announcement.author?._id || announcement.author;
    const isAuthor = authorId?.toString() === loggedInUser._id.toString();
    const isSuperAdmin = loggedInUser.systemRole === 'super-admin';
    return { isAuthor, isSuperAdmin };
};

const exportAnnouncementsCSV = async (filter = {}) => {
    const announcements = await Announcement.find(filter)
        .populate('author', 'name')
        .sort({ createdAt: -1 })
        .lean();

    const header = 'Title,Status,Author,Created At\n';
    const rows = announcements.map(a =>
        `"${(a.title || '').replace(/"/g, '""')}",${a.status},"${a.author?.name || ''}",${new Date(a.createdAt).toISOString().split('T')[0]}`
    ).join('\n');
    return header + rows;
};

module.exports = {
    getPublishedAnnouncements, getAllAnnouncements, createAnnouncement,
    getAnnouncementById, updateAnnouncement, deleteAnnouncement,
    checkOwnership, exportAnnouncementsCSV,
};
