// In: server/routes/customFieldRoutes.js

const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    createCustomField,
    getCustomFields,
    updateCustomField,
    deleteCustomField
} = require('../controllers/customFieldController');

const router = express.Router();

// All routes are protected and for super-admins only
router.use(protect, checkPermissions(PERMISSIONS.MANAGE_CUSTOM_FIELDS));

router.route('/')
    .post(createCustomField)
    .get(getCustomFields);

router.route('/:id')
    .put(updateCustomField)
    .delete(deleteCustomField);

module.exports = router;