// In: server/utils/generateToken.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const RefreshToken = require('../model/refreshToken.model');

const generateTokens = async (res, userId, userRole) => {
    
    const accessToken = jwt.sign({ id: userId, role: userRole, jti: crypto.randomUUID() }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
    });

    const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });

    // Store a hashed version of the refresh token for revocation

  // Hash the refresh token before persisting
  const salt = await bcrypt.genSalt(10);
  const tokenHash = await bcrypt.hash(refreshToken, salt);

  // Calculate expiry date based on JWT expiry (in seconds)
  const parseDuration = (str) => {
      const match = str.match(/^(\d+)([smhd])$/);
      if (!match) return parseInt(str) || 7 * 24 * 60 * 60;
      const num = parseInt(match[1]);
      const unit = match[2];
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      return num * multipliers[unit];
  };
  const expiresInSec = process.env.JWT_REFRESH_EXPIRE ? parseDuration(process.env.JWT_REFRESH_EXPIRE) : 7 * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + expiresInSec * 1000);

  // Persist the hashed token
  await RefreshToken.create({ tokenHash, user: userId, expiresAt });

  res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: expiresInSec * 1000,
    });

    return { accessToken };
};

module.exports = generateTokens;