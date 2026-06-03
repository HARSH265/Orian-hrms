const express = require('express');
const {
    createDepartment, getAllDepartments, getDepartmentById,
    updateDepartment, deleteDepartment, exportDepartments,
} = require('../controllers/departmentController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), exportDepartments);

router.route('/')
    .get(getAllDepartments)
    .post(checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), createDepartment);

router.route('/:id')
    .get(getDepartmentById)
    .put(checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), updateDepartment)
    .delete(checkPermissions(PERMISSIONS.MANAGE_DEPARTMENTS), deleteDepartment);

module.exports = router;
