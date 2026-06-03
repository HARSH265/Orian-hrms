// In: server/routes/checklistTemplateRoutes.js

const express = require('express');
const {
    getAllChecklistTemplates,
    getChecklistTemplateById,
    createChecklistTemplate,
    applyChecklistTemplate,
    updateChecklistTemplate,
    deleteChecklistTemplate
} = require('../controllers/checklistTemplateController');
// --- THE CHANGE: Import `checkPermissions` and `PERMISSIONS` ---
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require the user to be logged in
router.use(protect);

// --- THE UPGRADE: Use granular permissions instead of a hardcoded role ---
router.route('/')
    .get(checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), getAllChecklistTemplates)
    .post(checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), createChecklistTemplate);

router.route('/apply')
    .post(checkPermissions(PERMISSIONS.APPLY_CHECKLISTS), applyChecklistTemplate);

router.route('/:id')
    .get(getChecklistTemplateById)
    .put(checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), updateChecklistTemplate)
    .delete(checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), deleteChecklistTemplate);

module.exports = router;