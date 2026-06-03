const express = require('express');
const {
    createRequest, getMyRequests, getAllRequests, approveRequest, rejectRequest, fulfillRequest
} = require('../controllers/assetRequestController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const router = express.Router();

router.use(protect);

router.post('/', createRequest);
router.get('/my-requests', getMyRequests);

router.use(checkPermissions(PERMISSIONS.MANAGE_ASSETS));

router.get('/', getAllRequests);
router.put('/:id/approve', approveRequest);
router.put('/:id/reject', rejectRequest);
router.put('/:id/fulfill', fulfillRequest);

module.exports = router;
