const { getSettings, updateSettings } = require('../services/settingsService');
const asyncHandler = require('../utils/asyncHandler');

exports.getSettings = asyncHandler(async (req, res, next) => {
    try {
        const settings = await getSettings();
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

exports.updateSettings = asyncHandler(async (req, res, next) => {
    try {
        const newSettings = await updateSettings(req.body, req.user._id, req.ip);
        res.status(200).json({ success: true, data: newSettings });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    getSettings: exports.getSettings,
    updateSettings: exports.updateSettings,
};
