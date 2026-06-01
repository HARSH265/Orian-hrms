// In: server/routes/userRoutes.js

const express = require('express');
const {
    getProfile, getAllUsers, createUser, updateProfile, updateUserById, deactivateUser,
    getManagerUsers, completeWelcomeWizard, addSkillToProfile, removeSkillFromProfile, 
    endorseSkill, getUserChecklistInstances, getUserById
} = require('../controllers/userController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');

const router = express.Router();

// Apply login protection to all routes in this file
router.use(protect);

// =======================================================================
// --- ORDER OF ROUTES IS CRITICAL ---

// 1. Most Specific, Static Routes First
// These do not have any parameters in their path.
router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

router.get('/managers', checkPermissions(PERMISSIONS.MANAGE_USERS), getManagerUsers);
router.put('/complete-wizard', completeWelcomeWizard);
router.route('/profile/skills').post(addSkillToProfile);

// 2. Routes with ONE parameter that is NOT an ID at the end
router.route('/profile/skills/:skillId').delete(removeSkillFromProfile);

// 3. Routes with MULTIPLE parameters
router.route('/:userId/skills/:skillId/endorse').post(endorseSkill);

// 4. Routes with an ID parameter followed by more text
router.route('/:id/checklist-instances').get(checkPermissions(PERMISSIONS.VIEW_USER_CHECKLISTS), getUserChecklistInstances);


// 5. THE MOST GENERIC ROUTES (Admin User Management) LAST
// Because `/:id` can match almost anything, it must come after all other specific routes.
router.route('/')
    .get(checkPermissions(PERMISSIONS.VIEW_ALL_USERS), getAllUsers)
    .post(checkPermissions(PERMISSIONS.MANAGE_USERS), createUser);

router.route('/:id')
    .get(checkPermissions(PERMISSIONS.VIEW_ALL_USERS), getUserById)
    .put(checkPermissions(PERMISSIONS.MANAGE_USERS), updateUserById)     
    .delete(checkPermissions(PERMISSIONS.MANAGE_USERS), deactivateUser); 

// =======================================================================

module.exports = router;