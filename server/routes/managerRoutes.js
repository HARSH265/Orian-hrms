const express = require('express');
const { 
    getTeamLeaveRequests, 
    updateLeaveRequestStatus, 
    getMyTeam, 
    getLeaveRequestDetails // Ensure this is imported
} = require('../controllers/managerController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

// All routes in this file are protected and require at least a 'manager' role
router.use(protect);
// Note: It's often better to apply authorization per-route if some are manager-only
// but this is fine for now.
router.use(checkPermissions(PERMISSIONS.VIEW_TEAM_MEMBERS, PERMISSIONS.VIEW_TEAM_TASKS, PERMISSIONS.VIEW_TEAM_LEAVE, PERMISSIONS.APPROVE_LEAVE_REQUESTS));

// Route to get the list of leave requests for the table view
router.route('/team-leave-requests').get(getTeamLeaveRequests);

// --- THE FIX IS HERE ---
router.route('/leave-request/:id')
    // GET request to fetch details for the review modal
    .get(getLeaveRequestDetails)
    // PUT request to approve or deny the request
    .put(updateLeaveRequestStatus);
// --- END OF FIX ---

// Route to get the manager's team members (for other features)
router.route('/my-team').get(getMyTeam);

// The old '/team-leave-calendar' route has been removed.

module.exports = router;