const Announcement = require('../model/announcement.model');
const logger = require('../utils/logger');

const getPublishedAnnouncements = async () => {
    const announcements = await Announcement.find({ status: 'Published' })
        .populate('author', 'name')
        .sort({ createdAt: -1 });
    return announcements;
};

const createAnnouncement = async (data) => {
    const announcement = await Announcement.create(data);
    return announcement;
};

const getAnnouncementById = async (id) => {
    const announcement = await Announcement.findById(id);
    return announcement;
};

const updateAnnouncement = async (id, data) => {
    // Whitelist allowed fields
    const allowedFields = ['title', 'content', 'status'];
    const filteredUpdates = {};
    allowedFields.forEach(field => {
        if (data[field] !== undefined) {
            filteredUpdates[field] = data[field];
        }
    });
    const announcement = await Announcement.findByIdAndUpdate(id, filteredUpdates, {
        new: true,
        runValidators: true,
    });
    return announcement;
};

const deleteAnnouncement = async (id) => {
    await Announcement.findByIdAndDelete(id);
};

const checkOwnership = (announcement, loggedInUser) => {
    const isAuthor = announcement.author.toString() === loggedInUser.id.toString();
    const isSuperAdmin = loggedInUser.role === 'super-admin';
    return { isAuthor, isSuperAdmin };
};

module.exports = {
    getPublishedAnnouncements,
    createAnnouncement,
    getAnnouncementById,
    updateAnnouncement,
    deleteAnnouncement,
    checkOwnership,
};
