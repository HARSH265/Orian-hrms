const express = require('express');
const {
    getAllJobs,
    createJob,
    updateJob,
    deleteJob
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require login
router.use(protect);

// Get all jobs is accessible to everyone
router.route('/').get(getAllJobs);

// Create, Update, Delete are admin-only
router.route('/').post(authorize('hr', 'super-admin'), createJob);
router.route('/:id')
    .put(authorize('hr', 'super-admin'), updateJob)
    .delete(authorize('hr', 'super-admin'), deleteJob);

module.exports = router;