const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { getSettings, updateSettings, getConfigGroup, updateConfigGroup } = require('../controllers/settings.controller');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const router = express.Router();

router.use(protect);

router.get('/', getSettings);
router.put('/', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_SYSTEM_SETTINGS), updateSettings);

router.get('/groups/:group', getConfigGroup);
router.put('/groups/:group', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_SYSTEM_SETTINGS), updateConfigGroup);

module.exports = router;
