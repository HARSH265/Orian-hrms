const express = require('express');
const { getTeamLeaveRequests, updateLeaveRequestStatus, getMyTeam } = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// All routes in this file are protected and require at least a 'manager' role
router.use(protect);
router.use(authorize('manager', 'hr', 'super-admin'));

// Route to get all leave requests from the manager's team
router.route('/team-leave-requests').get(getTeamLeaveRequests);

// Route to update a specific leave request
router.route('/leave-requests/:id').put(updateLeaveRequestStatus);

// Route to get the manager's team members
router.route('/my-team').get(getMyTeam);

module.exports = router;