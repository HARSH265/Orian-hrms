const Settings = require('../model/Settings');
const asyncHandler = require('../utils/asyncHandler');
const { createAuditLog } = require('../services/auditLogService');

// @desc    Get the application settings
// @route   GET /api/settings
// @access  Private
// @desc    Get the application settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = asyncHandler(async (req, res, next) => {
    try {
        // Find the one and only settings document.
        // If it doesn't exist yet, we create a default one on the fly.
        let settings = await Settings.findOne({ singleton: 'main_settings' });

        if (!settings) {
            settings = await Settings.create({
                companyName: 'Orion HRMS',
                singleton: 'main_settings'
            });
        }

        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        next(error);
    }
});

// @desc    Update the application settings (Upsert)
// @route   PUT /api/settings
// @access  Private/Super-Admin
exports.updateSettings = asyncHandler(async (req, res, next) => {
    try {
        // --- 2. CAPTURE OLD SETTINGS FOR COMPARISON ---
        const oldSettings = await Settings.findOne({ singleton: 'main_settings' }).lean();

        const { companyName, companyLogoUrl, defaultCurrency } = req.body;
        const updateData = { companyName, companyLogoUrl, defaultCurrency };

        const newSettings = await Settings.findOneAndUpdate(
            { singleton: 'main_settings' },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );

        // --- 3. CREATE THE AUDIT LOG ---
        await createAuditLog({
            actor: req.user._id,
            action: 'SETTINGS_UPDATED',
            ipAddress: req.ip,
            details: {
                before: {
                    companyName: oldSettings?.companyName,
                    companyLogoUrl: oldSettings?.companyLogoUrl,
                },
                after: {
                    companyName: newSettings.companyName,
                    companyLogoUrl: newSettings.companyLogoUrl,
                }
            }
        });

        res.status(200).json({ success: true, data: newSettings });
    } catch (error) {
        next(error);
    }
});

// Export the functions
module.exports = {
    getSettings: exports.getSettings,
    updateSettings: exports.updateSettings,
};