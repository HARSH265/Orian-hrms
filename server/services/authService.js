const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/user');
const RefreshToken = require('../model/refreshToken.model');
const generateTokens = require('../utils/generateToken');
const logger = require('../utils/logger');
const { blacklistToken } = require('../utils/tokenBlacklist');

/**
 * Login a user. Handles password check, lockout, failed attempts, and token generation.
 * Returns an object { status, payload } where `payload` will be sent as JSON response.
 */
const loginUser = async (email, password, req, res) => {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    // Account lock check
    if (user && user.lockUntil && user.lockUntil > Date.now()) {
        return { status: 403, payload: { success: false, message: 'Account locked. Try again later.' } };
    }
    // User not found
    if (!user) {
        logger.error('[AUTH SERVICE] Login FAILED: Invalid credentials.');
        return { status: 401, payload: { success: false, message: 'Invalid credentials' } };
    }
    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
        // Increment failed attempts
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
            user.lockUntil = Date.now() + 15 * 60 * 1000; // lock 15min
        }
        await user.save();
        logger.error('[AUTH SERVICE] Login FAILED: Invalid credentials.');
        return { status: 401, payload: { success: false, message: 'Invalid credentials' } };
    }
    // Reset attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    // Generate tokens (access + refresh token stored via generateTokens)
    const { accessToken } = await generateTokens(res, user._id, user.systemRole);
    return { status: 200, payload: { success: true, accessToken } };
};

/**
 * Refresh access token using stored refresh token cookie.
 */
const refreshTokenUser = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return { status: 401, payload: { success: false, message: 'Unauthorized: No refresh token' } };
    }
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid refresh token' } };
    }
    const tokenDoc = await RefreshToken.findOne({ user: decoded.id, revoked: false });
    if (!tokenDoc) {
        return { status: 401, payload: { success: false, message: 'Unauthorized: Refresh token not recognized' } };
    }
    const isValid = await tokenDoc.isValid(refreshToken);
    if (!isValid) {
        return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid refresh token' } };
    }
    const user = await User.findById(decoded.id);
    if (!user) {
        logger.error('[AUTH SERVICE] Refresh FAILED: User in refresh token not found.');
        return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid user for refresh' } };
    }
    // Rotate tokens
    const { accessToken } = await generateTokens(res, user._id, user.systemRole);
    tokenDoc.revoked = true;
    await tokenDoc.save();
    return { status: 200, payload: { success: true, accessToken } };
};

/**
 * Logout user – revoke refresh token (if present) and clear cookie.
 */
const logoutUser = async (req, res) => {
    // Blacklist the current access token if provided in body
    if (req.body && req.body.accessToken) {
        blacklistToken(req.body.accessToken);
    }

    try {
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const tokenDoc = await RefreshToken.findOne({ user: decoded.id, revoked: false });
            if (tokenDoc) {
                tokenDoc.revoked = true;
                await tokenDoc.save();
            }
        }
    } catch (e) {
        // silently ignore
    }
    // Clear cookie
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    return { status: 200, payload: { success: true, message: 'User logged out' } };
};

/**
 * Generate a new 2FA secret for a user and persist temporary secret.
 */
const generateTwoFactorSecretUser = async (user) => {
    const speakeasy = require('speakeasy');
    const qrcode = require('qrcode');
    const secret = speakeasy.generateSecret({ name: `Orion HRMS (${user.email})` });
    user.twoFactorAuth.tempSecret = secret.base32;
    await user.save();
    // Return QR data and secret (caller should send response)
    const dataUrl = await new Promise((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err, url) => (err ? reject(err) : resolve(url)));
    });
    return { qrCode: dataUrl, secret: secret.base32 };
};

/**
 * Verify a 2FA code and enable 2FA on the user.
 */
const verifyTwoFactorCodeUser = async (user, code) => {
    const speakeasy = require('speakeasy');
    if (!user.twoFactorAuth.tempSecret) {
        return { success: false, message: 'Please generate a secret first.' };
    }
    const verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.tempSecret,
        encoding: 'base32',
        token: code,
    });
    if (!verified) {
        return { success: false, message: 'Invalid code. Please try again.' };
    }
    // Move temp secret to permanent and enable
    user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
    user.twoFactorAuth.tempSecret = undefined;
    user.twoFactorAuth.isEnabled = true;
    await user.save();
    return { success: true, message: '2FA has been enabled successfully!' };
};

/**
 * Disable 2FA for a user.
 */
const disableTwoFactorUser = async (user) => {
    user.twoFactorAuth.isEnabled = false;
    user.twoFactorAuth.secret = undefined;
    user.twoFactorAuth.tempSecret = undefined;
    await user.save();
    return { success: true, message: '2FA has been disabled.' };
};

module.exports = {
    loginUser,
    refreshTokenUser,
    logoutUser,
    generateTwoFactorSecretUser,
    verifyTwoFactorCodeUser,
    disableTwoFactorUser,
};
