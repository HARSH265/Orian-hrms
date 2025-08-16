const express = require('express');
const { login, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout); // Logout should be a protected route

module.exports = router;