const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../model/user');
const RefreshToken = require('../model/refreshToken.model');
const generateTokens = require('../utils/generateToken');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { blacklistToken } = require('../utils/tokenBlacklist');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { auditLogService } = require('./index');

/**
 * Login a user. Handles password check, lockout, failed attempts, and token generation.
 * Returns an object { status, payload } where `payload` will be sent as JSON response.
 */
const loginUser = async (email, password, req, res, twoFactorCode) => {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    // Account lock check
  if (user && user.lockUntil && user.lockUntil > Date.now()) {
    logger.error('[AUTH SERVICE] Login FAILED: Account locked.');
    return { status: 403, payload: { success: false, message: 'Account is temporarily locked. Please try again later.' } };
  }
  // Check if account is active
  if (user && !user.isActive) {
    logger.error('[AUTH SERVICE] Login FAILED: Account inactive.');
    return { status: 403, payload: { success: false, message: 'Account is inactive. Please contact support.' } };
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
    logger.error('[AUTH SERVICE] Login FAILED: Invalid password for user id ' + user._id);
    return { status: 401, payload: { success: false, message: 'Invalid credentials' } };
  }
    // Reset attempts on success
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    // Check if 2FA is enabled
    if (user.twoFactorAuth.isEnabled) {
        if (!twoFactorCode) {
            return { status: 200, payload: { success: true, twoFactorRequired: true } };
        }
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorAuth.secret,
            encoding: 'base32',
            token: twoFactorCode,
        });
        if (!verified) {
            return { status: 401, payload: { success: false, message: 'Invalid 2FA code' } };
        }
    }
    // Generate tokens (access + refresh token stored via generateTokens)
    const { accessToken } = await generateTokens(res, user._id, user.systemRole);
    await auditLogService.createAuditLog({ actor: user._id, action: 'USER_LOGIN', ipAddress: req.ip });
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
    logger.error('[AUTH SERVICE] Refresh FAILED: Invalid refresh token signature.');
    return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid refresh token' } };
  }
  const tokenDoc = await RefreshToken.findOne({ user: decoded.id, revoked: false });
  if (!tokenDoc) {
    logger.error('[AUTH SERVICE] Refresh FAILED: Refresh token not recognized for user id: ' + decoded.id);
    return { status: 401, payload: { success: false, message: 'Unauthorized: Refresh token not recognized' } };
  }
  const isValid = await tokenDoc.isValid(refreshToken);
  if (!isValid) {
    logger.error('[AUTH SERVICE] Refresh FAILED: Invalid refresh token content for token doc id: ' + tokenDoc._id);
    return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid refresh token' } };
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    logger.error('[AUTH SERVICE] Refresh FAILED: User in refresh token not found.');
    return { status: 401, payload: { success: false, message: 'Unauthorized: Invalid user for refresh' } };
  }
    // Rotate tokens
  // Invalidate the old refresh token
  tokenDoc.revoked = true;
  await tokenDoc.save();
  // Generate new tokens
  const { accessToken } = await generateTokens(res, user._id, user.systemRole);
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
            await RefreshToken.updateMany({ user: decoded.id, revoked: false }, { revoked: true });
        }
    } catch (e) {
        // silently ignore
    }
    if (req.user) {
        await auditLogService.createAuditLog({ actor: req.user._id, action: 'USER_LOGOUT', ipAddress: req.ip });
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
    const secret = speakeasy.generateSecret({ name: `Orion HRMS (${user.email})` });
    user.twoFactorAuth.tempSecret = secret.base32;
    await user.save();
    // Return QR data and secret (caller should send response)
    const dataUrl = await new Promise((resolve, reject) => {
        qrcode.toDataURL(secret.otpauth_url, (err, url) => (err ? reject(err) : resolve(url)));
    });
    return { qrCode: dataUrl };
};

/**
 * Verify a 2FA code and enable 2FA on the user.
 */
const verifyTwoFactorCodeUser = async (user, code) => {
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

/**
 * Change password for logged-in user (requires current password)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new Error('User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    user.password = newPassword;
    await user.save();

    return { message: 'Password changed successfully' };
};

/**
 * Generate password reset token
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        return { message: 'If an account exists, a reset link has been sent.' };
    }

  const resetToken = crypto.randomBytes(32).toString('hex');

    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();
  logger.info(`[AUTH] Password reset token issued for ${email}`);

    return { message: 'If an account exists, a reset link has been sent.' };
};

/**
 * Reset password using token
 */
const resetPassword = async (resetToken, newPassword) => {
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
        passwordResetToken: resetTokenHash,
        passwordResetExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        throw new Error('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
};

module.exports = {
    loginUser,
    refreshTokenUser,
    logoutUser,
    generateTwoFactorSecretUser,
    verifyTwoFactorCodeUser,
    disableTwoFactorUser,
    changePassword,
    forgotPassword,
    resetPassword,
};
