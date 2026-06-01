// In: server/routes/dashboardRoutes.js

const express = require('express');
const { getDataHealth, getTaskMetrics, getLeaveMetrics } = require('../controllers/dashboardController'); // <-- IMPORT NEW
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

// --- Data Health Route (HR/Admin only) ---
router.get('/data-health', checkPermissions(PERMISSIONS.VIEW_ALL_USERS), getDataHealth);

// --- Analytics Routes (Manager, HR, Admin) ---
router.get('/task-metrics', checkPermissions(PERMISSIONS.CREATE_TASKS), getTaskMetrics);
router.get('/leave-metrics', checkPermissions(PERMISSIONS.VIEW_TEAM_LEAVE), getLeaveMetrics); // <-- ADD NEW ROUTE

module.exports = router;