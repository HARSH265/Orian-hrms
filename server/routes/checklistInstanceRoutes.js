const express = require('express');
const { getActiveChecklistInstances, getInstanceById, completeInstance, autoComplete } = require('../controllers/checklistInstanceController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

router.get('/active', checkPermissions(PERMISSIONS.VIEW_USER_CHECKLISTS), getActiveChecklistInstances);
router.get('/:id', getInstanceById);
router.put('/:id/complete', writeLimiter, checkPermissions(PERMISSIONS.APPLY_CHECKLISTS), completeInstance);
router.post('/auto-complete', writeLimiter, autoComplete);

module.exports = router;
