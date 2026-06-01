const express = require('express');
const { getAllLeaveRequests } = require('../controllers/adminController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes in this file are protected and require at least an 'hr' role
router.use(protect);
router.use(checkPermissions(PERMISSIONS.MANAGE_USERS));

// Route to get all leave requests in the system
router.route('/leave-requests').get(getAllLeaveRequests);


module.exports = router;