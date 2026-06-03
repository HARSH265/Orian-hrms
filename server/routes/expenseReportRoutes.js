const express = require('express');
const { createReport, getMyReports, getReportById, submitReport } = require('../controllers/expenseReportController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);

router.route('/').post(createReport).get(getMyReports);
router.route('/:id').get(getReportById);
router.route('/:id/submit').put(submitReport);

module.exports = router;
