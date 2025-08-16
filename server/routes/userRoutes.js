const express = require('express');
const {
    getProfile,
    getAllUsers,
    createUser,
    updateProfile,
    updateUserById,
    deactivateUser,
    getManagerUsers,
    completeWelcomeWizard
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- General routes ---
router.route('/')
    .get(protect, authorize('hr', 'super-admin'), getAllUsers)
    .post(protect, authorize('hr', 'super-admin'), createUser);

// --- Specific, text-based routes MUST come before generic /:id routes ---

// GET /api/users/managers
router.get('/managers', protect, authorize('hr', 'super-admin'), getManagerUsers);

// PUT /api/users/complete-wizard
router.put('/complete-wizard', protect, completeWelcomeWizard);

// GET and PUT /api/users/profile
router.route('/profile')
    .get(protect, getProfile)
    .put(protect, updateProfile);

// --- Generic, wildcard /:id route MUST come LAST ---
// This will handle routes like /api/users/68948d589453eceac5c64e8a
router.route('/:id')
    .put(protect, authorize('hr', 'super-admin'), updateUserById)     
    .delete(protect, authorize('hr', 'super-admin'), deactivateUser); 

module.exports = router;