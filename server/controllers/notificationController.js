const { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../services/notificationControllerService');
const asyncHandler = require('../utils/asyncHandler');

exports.getMyNotifications = asyncHandler(async (req, res, next) => {
    try {
        const { page, limit, isRead, type } = req.query;
        const result = await getMyNotifications(req.user.id, { page, limit, isRead, type });
        res.status(200).json({ success: true, ...result });
    } catch (error) { next(error); }
});

exports.getUnreadCount = asyncHandler(async (req, res, next) => {
    try {
        const count = await getUnreadCount(req.user.id);
        res.status(200).json({ success: true, data: { count } });
    } catch (error) { next(error); }
});

exports.markAsRead = asyncHandler(async (req, res, next) => {
    try {
        const notification = await markAsRead(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: notification });
    } catch (error) { next(error); }
});

exports.markAllAsRead = asyncHandler(async (req, res, next) => {
    try {
        const result = await markAllAsRead(req.user.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) { next(error); }
});
