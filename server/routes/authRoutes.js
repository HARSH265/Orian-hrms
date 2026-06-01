const express = require('express');
const { login, refreshToken, logout,generateTwoFactorSecret, verifyTwoFactorCode, disableTwoFactor } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter, refreshLimiter, sensitiveActionLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refreshToken);
router.post('/logout', protect, logout);

router.route('/2fa/generate')
    .post(protect, sensitiveActionLimiter, generateTwoFactorSecret);

router.route('/2fa/verify')
    .post(protect, sensitiveActionLimiter, verifyTwoFactorCode);

router.route('/2fa/disable')
    .post(protect, sensitiveActionLimiter, disableTwoFactor);

module.exports = router;