const express = require('express');
const { 
    createDepartment, 
    getAllDepartments, 
    updateDepartment, 
    deleteDepartment 
} = require('../controllers/departmentController');

const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// The GET route is accessible to any logged-in user
router.route('/')
    .get(protect, getAllDepartments)
    .post(protect, checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), createDepartment);

// The PUT and DELETE routes are only for admins
router.route('/:id')
    .put(protect, checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), updateDepartment)
    .delete(protect, checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), deleteDepartment);

module.exports = router;