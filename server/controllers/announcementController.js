const asyncHandler = require('../utils/asyncHandler');
const announcementService = require('../services/announcementService');

exports.getPublishedAnnouncements = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await announcementService.getPublishedAnnouncements({ page, limit });
    res.json({ success: true, ...result });
});

exports.getAllAnnouncements = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await announcementService.getAllAnnouncements({ page, limit, status });
    res.json({ success: true, ...result });
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
    const { title, content, status } = req.body;
    const announcement = await announcementService.createAnnouncement(
        { title, content, status, author: req.user.id }, req.user.id, req.ip
    );
    res.status(201).json({ success: true, data: announcement });
});

exports.getAnnouncementById = asyncHandler(async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.params.id);
        res.json({ success: true, data: announcement });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.updateAnnouncement = asyncHandler(async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.params.id);
        const { isAuthor, isSuperAdmin } = announcementService.checkOwnership(announcement, req.user);
        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        const updated = await announcementService.updateAnnouncement(req.params.id, req.body, req.user.id, req.ip);
        res.json({ success: true, data: updated });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.deleteAnnouncement = asyncHandler(async (req, res, next) => {
    try {
        const announcement = await announcementService.getAnnouncementById(req.params.id);
        const { isAuthor, isSuperAdmin } = announcementService.checkOwnership(announcement, req.user);
        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
        await announcementService.deleteAnnouncement(req.params.id, req.user.id, req.ip);
        res.json({ success: true, message: 'Announcement deleted.' });
    } catch (error) {
        if (error.status) return res.status(error.status).json({ success: false, message: error.message });
        next(error);
    }
});

exports.exportAnnouncements = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const csv = await announcementService.exportAnnouncementsCSV(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="announcements-export.csv"');
    res.send(csv);
});
