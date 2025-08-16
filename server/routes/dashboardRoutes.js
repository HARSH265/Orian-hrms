const express = require('express');
const { getDataHealth } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All dashboard routes are for admins only
router.use(protect, authorize('hr', 'super-admin'));

router.get('/data-health', getDataHealth);

module.exports = router;