const express = require('express');
const { login, refreshToken, logout,generateTwoFactorSecret, verifyTwoFactorCode, disableTwoFactor } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const rateLimit = require('express-rate-limit');
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});


router.post('/login', loginLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout); // Logout should be a protected route

// These must be protected, as only a logged-in user can manage their own 2FA.
router.route('/2fa/generate')
    .post(protect, generateTwoFactorSecret);

router.route('/2fa/verify')
    .post(protect, verifyTwoFactorCode);

router.route('/2fa/disable')
    .post(protect, disableTwoFactor);

module.exports = router;