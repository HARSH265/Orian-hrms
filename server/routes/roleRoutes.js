// In: server/routes/roleRoutes.js
const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { 
    getAllRoles, 
    createRole,
    updateRole, 
    deleteRole  
} = require('../controllers/roleController');

const router = express.Router();
router.use(protect, checkPermissions(PERMISSIONS.MANAGE_ROLES_PERMISSIONS));

router.route('/')
    .get(getAllRoles)
    .post(createRole);

// --- NEW: Route for updating and deleting a single role ---
router.route('/:id')
    .put(updateRole)
    .delete(deleteRole);

module.exports = router;