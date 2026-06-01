const express = require('express');
const {
    getAllJobs,
    createJob,
    updateJob,
    deleteJob
} = require('../controllers/jobController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require login
router.use(protect);

// Get all jobs is accessible to everyone
router.route('/').get(getAllJobs);

// Create, Update, Delete are admin-only
router.route('/').post(checkPermissions(PERMISSIONS.MANAGE_JOBS), createJob);
router.route('/:id')
    .put(checkPermissions(PERMISSIONS.MANAGE_JOBS), updateJob)
    .delete(checkPermissions(PERMISSIONS.MANAGE_JOBS), deleteJob);

module.exports = router;