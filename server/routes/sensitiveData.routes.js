const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const { getSensitiveData, updateSensitiveData } = require('../controllers/sensitiveData.controller');

const router = express.Router();

router.use(protect);

router.route('/:userId')
    .get(checkPermissions(PERMISSIONS.VIEW_SENSITIVE_DATA), getSensitiveData)
    .put(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_SENSITIVE_DATA), updateSensitiveData);

module.exports = router;
