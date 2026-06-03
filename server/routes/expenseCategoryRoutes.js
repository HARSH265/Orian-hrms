const express = require('express');
const {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/expenseCategoryController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

router.use(protect);

router.route('/')
    .get(getAllCategories)
    .post(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), createCategory);

router.route('/:id')
    .get(getCategory)
    .put(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), updateCategory)
    .delete(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), deleteCategory);

module.exports = router;
