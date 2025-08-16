const express = require('express');
const { 
    getPublishedAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// The GET route is accessible to any logged-in user to see announcements
router.route('/')
    .get(protect, getPublishedAnnouncements)
    .post(protect, authorize('hr', 'super-admin'), createAnnouncement);

// The PUT and DELETE routes are only for admins to manage announcements
router.route('/:id')
    .put(protect, authorize('hr', 'super-admin'), updateAnnouncement)
    .delete(protect, authorize('hr', 'super-admin'), deleteAnnouncement);

module.exports = router;