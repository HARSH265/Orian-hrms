const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    getSettings,
    updateSettings,
} = require('../controllers/settings.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// We use the root route '/' because there is only one settings document.
router.route('/')
    .get(getSettings) // Any authenticated user can get settings (for branding)
    .put(checkPermissions(PERMISSIONS.MANAGE_SYSTEM_SETTINGS), updateSettings); // Only super-admins can change them

module.exports = router;