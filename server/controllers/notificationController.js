const { getMyNotifications, markAsRead } = require('../services/notificationControllerService');

exports.getMyNotifications = async (req, res, next) => {
    try {
        const notifications = await getMyNotifications(req.user.id);
        res.status(200).json({ success: true, data: notifications });
    } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await markAsRead(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: notification });
    } catch (error) { next(error); }
};
