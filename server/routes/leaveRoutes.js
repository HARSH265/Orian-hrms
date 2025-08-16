const express = require('express');
const { applyForLeave, getMyLeaveHistory, withdrawLeaveRequest } = require('../controllers/leaveController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes in this file are protected
router.use(protect);

router.route('/')
    .post(applyForLeave);

router.route('/my-history')
    .get(getMyLeaveHistory);

    router.route('/:id/withdraw')
    .put(withdrawLeaveRequest);

module.exports = router;