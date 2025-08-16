const express = require('express');
const { 
    createDepartment, 
    getAllDepartments, 
    updateDepartment, 
    deleteDepartment 
} = require('../controllers/departmentController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// The GET route is accessible to any logged-in user
router.route('/')
    .get(protect, getAllDepartments)
    .post(protect, authorize('hr', 'super-admin'), createDepartment);

// The PUT and DELETE routes are only for admins
router.route('/:id')
    .put(protect, authorize('hr', 'super-admin'), updateDepartment)
    .delete(protect, authorize('hr', 'super-admin'), deleteDepartment);

module.exports = router;