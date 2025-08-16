const express = require('express');
const { getAllLeaveRequests } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this file are protected and require at least an 'hr' role
router.use(protect);
router.use(authorize('hr', 'super-admin'));

// Route to get all leave requests in the system
router.route('/leave-requests').get(getAllLeaveRequests);


module.exports = router;