const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    getAllRoles, getRoleById, createRole, cloneRole, updateRole, deleteRole,
} = require('../controllers/roleController');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();
router.use(protect, checkPermissions(PERMISSIONS.MANAGE_ROLES_PERMISSIONS));

router.route('/')
    .get(getAllRoles)
    .post(writeLimiter, createRole);

router.post('/:id/clone', writeLimiter, cloneRole);

router.route('/:id')
    .get(getRoleById)
    .put(writeLimiter, updateRole)
    .delete(writeLimiter, deleteRole);

module.exports = router;
