const express = require('express');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const {
    createSurvey,
    getAllSurveys,
    getSurveyById,
    updateSurvey,
    deleteSurvey,
    submitResponse,
    getSurveyResults,
    getMyAssignedSurveys,
} = require('../controllers/survey.controller');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin routes for managing surveys
router.route('/')
    .post(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), createSurvey)
    .get(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), getAllSurveys);

// Route for employees to get their assigned surveys
router.get('/my-surveys', getMyAssignedSurveys);

router.route('/:id')
    .get(checkPermissions(PERMISSIONS.VIEW_SURVEYS), getSurveyById) // A user needs to get a survey to take it
            .put(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), updateSurvey)
            .delete(checkPermissions(PERMISSIONS.MANAGE_SURVEYS), deleteSurvey);

// Routes for responses and results
router.post('/:id/responses', submitResponse);
router.get('/:id/results', checkPermissions(PERMISSIONS.MANAGE_SURVEYS), getSurveyResults);

module.exports = router;