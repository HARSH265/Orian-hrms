const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const { auditLogService } = require('../services');
const authService = require('../services/authService');

// Login – delegates to authService
exports.login = asyncHandler(async (req, res) => {
    const { email, password, twoFactorCode } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    const result = await authService.loginUser(email, password, req, res, twoFactorCode);
    return res.status(result.status).json(result.payload);
});

// Generate a new 2FA secret for the logged-in user
exports.generateTwoFactorSecret = asyncHandler(async (req, res) => {
    const data = await authService.generateTwoFactorSecretUser(req.user);
    // data contains qrCode and secret
    res.status(200).json({ success: true, data });
});

// Verify a 2FA code and enable 2FA for the user
exports.verifyTwoFactorCode = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const result = await authService.verifyTwoFactorCodeUser(req.user, code);
    if (result.success) {
        await auditLogService.createAuditLog({ actor: req.user._id, action: 'USER_2FA_ENABLED', ipAddress: req.ip });
        return res.status(200).json(result);
    }
    return res.status(400).json(result);
});

// Disable 2FA for the logged-in user
exports.disableTwoFactor = asyncHandler(async (req, res) => {
    const result = await authService.disableTwoFactorUser(req.user);
    await auditLogService.createAuditLog({ actor: req.user._id, action: 'USER_2FA_DISABLED', ipAddress: req.ip });
    return res.status(200).json(result);
});

// Refresh access token
exports.refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshTokenUser(req, res);
    return res.status(result.status).json(result.payload);
});

// Logout user
exports.logout = asyncHandler(async (req, res) => {
    const result = await authService.logoutUser(req, res);
    return res.status(result.status).json(result.payload);
});

// Change password (self-service)
exports.changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    await auditLogService.createAuditLog({ actor: req.user._id, action: 'PASSWORD_CHANGED', ipAddress: req.ip });
    return res.status(200).json(result);
});

// Forgot password
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Please provide an email' });
    }
    const result = await authService.forgotPassword(email);
    return res.status(200).json(result);
});

// Reset password
exports.resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide token and new password' });
    }
    const result = await authService.resetPassword(token, newPassword);
    return res.status(200).json(result);
});
