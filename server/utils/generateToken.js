const jwt = require('jsonwebtoken');

const generateTokens = (res, userId, userRole) => {
    // Create access token
    const accessToken = jwt.sign({ id: userId, role: userRole }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE,
    });

    // Create refresh token
    const refreshToken = 
    jwt.sign({ id: userId }, 
        process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE,
    });

    // Set refresh token in a secure, httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    // --- BARE METAL SETTINGS FOR LOCAL DEVELOPMENT ---
    secure: false,     // Do not require HTTPS
    sameSite: 'lax',   // Lax is usually fine, but we will test without it if needed
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // We are NOT setting a 'domain' or 'path' to keep it simple.
});

    return { accessToken };
};

module.exports = generateTokens;