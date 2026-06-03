const express = require('express');
const {
    getTemplates, getTemplateById, createTemplate, updateTemplate, deleteTemplate, applyTemplate,
} = require('../controllers/taskTemplateController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getTemplates)
    .post(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), createTemplate);

router.route('/:id')
    .get(getTemplateById)
    .put(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), updateTemplate)
    .delete(writeLimiter, checkPermissions(PERMISSIONS.MANAGE_CHECKLIST_TEMPLATES), deleteTemplate);

router.post('/:id/apply', writeLimiter, applyTemplate);

module.exports = router;
