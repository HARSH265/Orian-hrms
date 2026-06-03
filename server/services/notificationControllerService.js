const Notification = require('../model/notification.model');
const { parsePagination, buildPagination } = require('../utils/pagination');

const getMyNotifications = async (userId, { page, limit, isRead, type } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });

    const query = { recipient: userId };
    if (isRead !== undefined) query.isRead = isRead === 'true' || isRead === true;
    if (type) query.type = type;

    const [notifications, total] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .populate('sender', 'name profilePictureUrl')
            .lean(),
        Notification.countDocuments(query),
    ]);

    return { data: notifications, pagination: buildPagination(total, p, l) };
};

const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ recipient: userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
    );
    return notification;
};

const markAllAsRead = async (userId) => {
    const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
    );
    return { modifiedCount: result.modifiedCount };
};

module.exports = { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead };
