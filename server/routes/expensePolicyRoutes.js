const express = require('express');
const { getAllPolicies, createPolicy, updatePolicy, deletePolicy } = require('../controllers/expensePolicyController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();
router.use(protect);

router.route('/')
    .get(getAllPolicies)
    .post(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), createPolicy);

router.route('/:id')
    .put(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), updatePolicy)
    .delete(checkPermissions(PERMISSIONS.MANAGE_EXPENSES), deletePolicy);

module.exports = router;
