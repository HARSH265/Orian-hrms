const express = require('express');
const { getMyNotifications, getUnreadCount, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { getMyPreferences, updateMyPreferences } = require('../controllers/notificationPreferenceController');
const { protect } = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/preferences', getMyPreferences);
router.put('/preferences', writeLimiter, updateMyPreferences);
router.put('/:id/read', markAsRead);
router.put('/read-all', writeLimiter, markAllAsRead);

module.exports = router;
