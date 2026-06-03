const express = require('express');
const {
    getProfile, getAllUsers, createUser, updateProfile, updateUserById, deactivateUser, reactivateUser,
    getManagerUsers, completeWelcomeWizard, addSkillToProfile, removeSkillFromProfile,
    endorseSkill, getUserChecklistInstances, getUserById, exportUsers,
} = require('../controllers/userController');
const { protect, checkPermissions } = require('../middleware/authMiddleware');
const { PERMISSIONS } = require('../config/permissions');
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.use(protect);

// ─── Static self-service routes ─────────────────────────────
router.get('/profile', getProfile);
router.put('/profile', writeLimiter, updateProfile);
router.post('/profile/skills', writeLimiter, addSkillToProfile);
router.delete('/profile/skills/:skillId', writeLimiter, removeSkillFromProfile);

router.put('/complete-wizard', writeLimiter, completeWelcomeWizard);

// ─── Admin routes ───────────────────────────────────────────
router.get('/managers', checkPermissions(PERMISSIONS.MANAGE_USERS), getManagerUsers);
router.get('/export', checkPermissions(PERMISSIONS.MANAGE_USERS), exportUsers);

router.post('/', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_USERS), createUser);
router.get('/', checkPermissions(PERMISSIONS.VIEW_ALL_USERS), getAllUsers);

// ─── Multi-param routes ─────────────────────────────────────
router.post('/:userId/skills/:skillId/endorse', writeLimiter, endorseSkill);
router.get('/:id/checklist-instances', checkPermissions(PERMISSIONS.VIEW_USER_CHECKLISTS), getUserChecklistInstances);
router.put('/:id/reactivate', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_USERS), reactivateUser);

// ─── /:id routes (must be last) ─────────────────────────────
router.get('/:id', checkPermissions(PERMISSIONS.VIEW_ALL_USERS), getUserById);
router.put('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_USERS), updateUserById);
router.delete('/:id', writeLimiter, checkPermissions(PERMISSIONS.MANAGE_USERS), deactivateUser);

module.exports = router;
