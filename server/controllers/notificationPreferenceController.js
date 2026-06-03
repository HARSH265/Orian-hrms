const { getPreferences, updatePreferences } = require('../services/notificationPreferenceService');
const asyncHandler = require('../utils/asyncHandler');

exports.getMyPreferences = asyncHandler(async (req, res, next) => {
    try {
        const prefs = await getPreferences(req.user.id);
        res.status(200).json({ success: true, data: prefs });
    } catch (error) { next(error); }
});

exports.updateMyPreferences = asyncHandler(async (req, res, next) => {
    try {
        const prefs = await updatePreferences(req.user.id, req.body);
        res.status(200).json({ success: true, data: prefs });
    } catch (error) { next(error); }
});
