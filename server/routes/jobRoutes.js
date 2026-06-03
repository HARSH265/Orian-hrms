const express = require('express');
const {
    getAllJobs, getJobById, createJob, updateJob, deleteJob, exportJobs,
} = require('../controllers/jobController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// All routes require login
router.use(protect);

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_JOBS), exportJobs);

router.route('/').get(getAllJobs).post(checkPermissions(PERMISSIONS.MANAGE_JOBS), createJob);
router.route('/:id')
    .get(getJobById)
    .put(checkPermissions(PERMISSIONS.MANAGE_JOBS), updateJob)
    .delete(checkPermissions(PERMISSIONS.MANAGE_JOBS), deleteJob);

module.exports = router;