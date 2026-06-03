const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { featureEnabled } = require('../middleware/featureToggle');
const { PERMISSIONS } = require('../config/permissions');
const {
    createSurvey, getAllSurveys, getSurveyById, updateSurvey, deleteSurvey,
    submitResponse, getSurveyResults, getMyAssignedSurveys, exportSurveys,
} = require('../controllers/survey.controller');

const router = express.Router();

// All routes are protected
router.use(protect);
router.use(featureEnabled('surveys'));

router.get('/export', checkPermissions(PERMISSIONS.MANAGE_SURVEYS), exportSurveys);

router.route('/')
    .post(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), createSurvey)
    .get(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), getAllSurveys);

// Route for employees to get their assigned surveys
router.get('/my-surveys', getMyAssignedSurveys);

router.route('/:id')
    .get(checkPermissions(PERMISSIONS.VIEW_SURVEYS), getSurveyById)
    .put(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), updateSurvey)
    .delete(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), deleteSurvey);

// Routes for responses and results
router.post('/:id/responses', submitResponse);
router.get('/:id/results', checkPermissions(PERMISSIONS.MANAGE_SURVEYS), getSurveyResults);

module.exports = router;