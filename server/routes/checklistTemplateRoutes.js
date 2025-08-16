const express = require('express');
const {
    getAllChecklistTemplates,
    createChecklistTemplate,
    applyChecklistTemplate
} = require('../controllers/checklistTemplateController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are for admins only
router.use(protect, authorize('hr', 'super-admin'));

router.route('/')
    .get(getAllChecklistTemplates)
    .post(createChecklistTemplate);

router.route('/apply')
    .post(applyChecklistTemplate);

module.exports = router;