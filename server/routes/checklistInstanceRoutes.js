// In: server/routes/checklistInstanceRoutes.js

const express = require('express');
const { getActiveChecklistInstances } = require('../controllers/checklistInstanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect, checkPermissions(PERMISSIONS.VIEW_USER_CHECKLISTS));

router.route('/active').get(getActiveChecklistInstances);

module.exports = router;