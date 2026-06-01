// In: server/routes/sensitiveDataRoutes.js

const express = require('express');
// --- THE CHANGE: Import `checkPermissions` instead of `authorize` ---
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const {
    getSensitiveData,
    updateSensitiveData,
} = require('../controllers/sensitiveData.controller');
// --- THE CHANGE: Import the PERMISSIONS constants ---
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes still require a user to be logged in
router.use(protect);

// --- THE UPGRADE: Instead of a hardcoded role, we now check for specific permissions ---

router.route('/:userId')
    // To view data, the user must have a role that grants the 'view_sensitive_data' permission.
    .get(checkPermissions(PERMISSIONS.VIEW_SENSITIVE_DATA), getSensitiveData)
    // To update data, the user must have a role that grants the 'manage_sensitive_data' permission.
    .put(checkPermissions(PERMISSIONS.MANAGE_SENSITIVE_DATA), updateSensitiveData);

module.exports = router;