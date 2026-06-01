const express = require('express');
const { 
    getPublishedAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement
} = require('../controllers/announcementController');

const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// The GET route is accessible to any logged-in user to see announcements
router.route('/')
    .get(protect, getPublishedAnnouncements)
    .post(protect, checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), createAnnouncement);

// The PUT and DELETE routes are only for admins to manage announcements
router.route('/:id')
    .put(protect, checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), updateAnnouncement)
    .delete(protect, checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), deleteAnnouncement);

module.exports = router;