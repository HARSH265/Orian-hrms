const { getPublishedAnnouncements, createAnnouncement, getAnnouncementById, updateAnnouncement, deleteAnnouncement, checkOwnership } = require('../services/announcementService');

// @desc    Get all published announcements
// @route   GET /api/announcements
// @access  Private (All logged-in users)
exports.getPublishedAnnouncements = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await getPublishedAnnouncements({ page, limit });
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new announcement
// @route   POST /api/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, status } = req.body;
        const author = req.user.id;

        const announcement = await createAnnouncement({ title, content, status, author });
        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

// @desc    Update an announcement
// @route   PUT /api/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = async (req, res, next) => {
    try {
        const announcement = await getAnnouncementById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const { isAuthor, isSuperAdmin } = checkOwnership(announcement, req.user);

        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this announcement.' });
        }

        const updatedAnnouncement = await updateAnnouncement(req.params.id, req.body);

        res.status(200).json({ success: true, data: updatedAnnouncement });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res, next) => {
    try {
        const announcement = await getAnnouncementById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const { isAuthor, isSuperAdmin } = checkOwnership(announcement, req.user);

        if (!isAuthor && !isSuperAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this announcement.' });
        }

        await deleteAnnouncement(req.params.id);

        res.status(200).json({ success: true, message: 'Announcement deleted' });
    } catch (error) {
        next(error);
    }
};
