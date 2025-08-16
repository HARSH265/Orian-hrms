const express = require('express');
const { getUsersForDirectory, getDataForOrgChart } = require('../controllers/directoryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All directory routes are accessible to any logged-in user
router.use(protect);

router.get('/users', getUsersForDirectory);
router.get('/org-chart', getDataForOrgChart);

module.exports = router;