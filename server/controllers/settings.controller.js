const { getSettings, updateSettings, getConfigGroup, updateConfigGroup } = require('../services/settingsService');
const asyncHandler = require('../utils/asyncHandler');

exports.getSettings = asyncHandler(async (req, res, next) => {
    const settings = await getSettings();
    res.status(200).json({ success: true, data: settings });
});

exports.updateSettings = asyncHandler(async (req, res, next) => {
    const newSettings = await updateSettings(req.body, req.user._id, req.ip);
    res.status(200).json({ success: true, data: newSettings });
});

exports.getConfigGroup = asyncHandler(async (req, res, next) => {
    const group = await getConfigGroup(req.params.group);
    if (group === null) return res.status(404).json({ success: false, message: 'Unknown config group.' });
    res.status(200).json({ success: true, data: group });
});

exports.updateConfigGroup = asyncHandler(async (req, res, next) => {
    const group = await updateConfigGroup(req.params.group, req.body, req.user._id, req.ip);
    res.status(200).json({ success: true, data: group });
});
