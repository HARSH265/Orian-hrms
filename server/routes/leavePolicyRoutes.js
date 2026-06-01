const express = require('express');
const { 
    getAllLeavePolicies, 
    createLeavePolicy, 
    updateLeavePolicy, 
    archiveLeavePolicy 
} = require('../controllers/leavePolicyController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// Get all is for any logged-in user (for forms)
router.route('/').get(protect, getAllLeavePolicies);

// Create, Update, Delete are for admins only
router.use(protect, checkPermissions(PERMISSIONS.MANAGE_LEAVE_POLICIES));
router.route('/').post(createLeavePolicy);
router.route('/:id')
    .put(updateLeavePolicy)
    .delete(archiveLeavePolicy);

module.exports = router;