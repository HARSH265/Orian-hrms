const Notification = require('../model/notification.model');
const logger = require('../utils/logger');

const getMyNotifications = async (userId) => {
    const notifications = await Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    return notifications;
};

const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
    );
    return notification;
};

module.exports = { getMyNotifications, markAsRead };
