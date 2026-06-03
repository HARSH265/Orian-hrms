const express = require('express');
const {
    getPublishedAnnouncements, getAllAnnouncements, createAnnouncement,
    getAnnouncementById, updateAnnouncement, deleteAnnouncement, exportAnnouncements,
} = require('../controllers/announcementController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), exportAnnouncements);
router.get('/all', checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), getAllAnnouncements);

router.route('/')
    .get(getPublishedAnnouncements)
    .post(checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), createAnnouncement);

router.route('/:id')
    .get(getAnnouncementById)
    .put(checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), updateAnnouncement)
    .delete(checkPermissions(PERMISSIONS.MANAGE_ANNOUNCEMENTS), deleteAnnouncement);

module.exports = router;
