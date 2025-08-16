const Notification = require('../model/notification.model');

// @desc    Get the logged-in user's notifications
exports.getMyNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ recipient: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20); // Limit to the most recent 20
        res.status(200).json({ success: true, data: notifications });
    } catch (error) { next(error); }
};

// @desc    Mark a notification as read
exports.markAsRead = async (req, res, next) => {
    try {
        // We could also implement a "mark all as read" endpoint later
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id }, // Ensure user can only mark their own
            { isRead: true },
            { new: true }
        );
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }
        res.status(200).json({ success: true, data: notification });
    } catch (error) { next(error); }
};