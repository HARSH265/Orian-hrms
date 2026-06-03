const express = require('express');
const { getAll, getById, create, update, remove } = require('../controllers/reviewTemplateController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_REVIEWS), create);
router.put('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_REVIEWS), update);
router.delete('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_REVIEWS), remove);

module.exports = router;
