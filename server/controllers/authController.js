const User = require('../model/user');
const generateTokens = require('../utils/generateToken');
const jwt = require('jsonwebtoken');



// login user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const { accessToken } = generateTokens(res, user._id, user.role);

        res.status(200).json({
            success: true,
            accessToken,
        });
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

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid user' });
        }

        // Issue a new access token (refresh token remains the same)
        const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRE,
        });

        res.status(200).json({ success: true, accessToken });
    } catch (error) {
        // This catches expired refresh tokens
        next(error);
    }
};

// Log user out
exports.logout = (req, res, next) => {
    // Clear the refresh token cookie
    res.cookie('refreshToken', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
    });
    res.status(200).json({ success: true, message: 'User logged out' });
};