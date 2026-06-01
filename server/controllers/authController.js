const User = require('../model/user');
const generateTokens = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const { createAuditLog } = require('../services/auditLogService');
const speakeasy = require('speakeasy'); 
const qrcode = require('qrcode');
const RefreshToken = require('../model/refreshToken.model');
const bcrypt = require('bcrypt');

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        // Check if account is locked
        if (user && user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({ success: false, message: 'Account locked. Please try again later.' });
        }
        
if (!user) {
    console.error('[AUTH CONTROLLER] Login FAILED: Invalid credentials.');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
}

// Verify password
const passwordMatches = await user.matchPassword(password);
if (!passwordMatches) {
    // Increment failed login attempts
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // lock for 15 minutes
    }
    await user.save();
    console.error('[AUTH CONTROLLER] Login FAILED: Invalid credentials.');
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
}

// Reset failed attempts on successful login
user.failedLoginAttempts = 0;
user.lockUntil = undefined;
await user.save();
        
      
        // ... (2FA logic is okay, we can skip logging it for now)

        const { accessToken } = await generateTokens(res, user._id, user.systemRole);
        
        res.status(200).json({ success: true, accessToken });
    } catch (error) {
        console.error('[AUTH CONTROLLER] CRITICAL ERROR in login:', error);
        next(error);
    }
};
// @desc    Generate a new 2FA secret for the logged-in user
// @route   POST /api/auth/2fa/generate
// @access  Private
exports.generateTwoFactorSecret = async (req, res, next) => {
    try {
        const secret = speakeasy.generateSecret({
            name: `Orion HRMS (${req.user.email})`,
        });

        // Save the temporary secret to the user's document
        req.user.twoFactorAuth.tempSecret = secret.base32;
        await req.user.save();

        // Generate a QR code for the user to scan
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) { throw new Error('Could not generate QR code.'); }
            res.status(200).json({ success: true, data: { qrCode: data_url, secret: secret.base32 } });
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify a 2FA code and enable 2FA for the user
// @route   POST /api/auth/2fa/verify
// @access  Private
exports.verifyTwoFactorCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        const user = req.user;

        if (!user.twoFactorAuth.tempSecret) {
            return res.status(400).json({ success: false, message: 'Please generate a secret first.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorAuth.tempSecret,
            encoding: 'base32',
            token: code,
        });

        if (verified) {
            // Success! Move the temp secret to the permanent secret and enable 2FA.
            user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
            user.twoFactorAuth.tempSecret = undefined; // Clear the temp secret
            user.twoFactorAuth.isEnabled = true;
            await user.save();
            
            await createAuditLog({ actor: user._id, action: 'USER_2FA_ENABLED', ipAddress: req.ip });

            res.status(200).json({ success: true, message: '2FA has been enabled successfully!' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid code. Please try again.' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Disable 2FA for the logged-in user
// @route   POST /api/auth/2fa/disable
// @access  Private
exports.disableTwoFactor = async (req, res, next) => {
    try {
        const user = req.user;
        user.twoFactorAuth.isEnabled = false;
        user.twoFactorAuth.secret = undefined;
        user.twoFactorAuth.tempSecret = undefined;
        await user.save();

        await createAuditLog({ actor: user._id, action: 'USER_2FA_DISABLED', ipAddress: req.ip });

        res.status(200).json({ success: true, message: '2FA has been disabled.' });
    } catch (error) {
        next(error);
    }
};

// refresh access token
exports.refreshToken = async (req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No refresh token' });
        }
        // Verify JWT signature and get payload
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        // Find stored refresh token record for this user
        const tokenDoc = await RefreshToken.findOne({ user: decoded.id, revoked: false });
        if (!tokenDoc) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Refresh token not recognized' });
        }
        const isValid = await tokenDoc.isValid(refreshToken);
        if (!isValid) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid refresh token' });
        }
        // Load user
        const user = await User.findById(decoded.id);
        if (!user) {
            console.error('[AUTH CONTROLLER] Refresh FAILED: User in refresh token not found.');
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user for refresh' });
        }
        // Rotate: generate new tokens (access + new refresh) and revoke old record
        const { accessToken } = await generateTokens(res, user._id, user.systemRole);
        tokenDoc.revoked = true;
        await tokenDoc.save();
        res.status(200).json({ success: true, accessToken });
    } catch (error) {
        console.error('[AUTH CONTROLLER] CRITICAL ERROR in refreshToken:', error.message);
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid refresh token.' });
    }
};


exports.logout = async (req, res, next) => {
    // Revoke the refresh token in DB if present
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
    } catch (err) {
        // Ignore errors (e.g., token already invalid/expired)
    }

    // Clear the refresh token cookie
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ success: true, message: 'User logged out' });
};



