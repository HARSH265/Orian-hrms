const Settings = require('../model/Settings');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const getSettings = async () => {
    let settings = await Settings.findOne({ singleton: 'main_settings' }).lean();

    if (!settings) {
        settings = await Settings.create({
            companyName: 'Orion HRMS',
            singleton: 'main_settings'
        });
    }

    return settings;
};

const updateSettings = async (updateFields, actorId, ip) => {
    const oldSettings = await Settings.findOne({ singleton: 'main_settings' }).lean();

    const { companyName, companyLogoUrl, defaultCurrency } = updateFields;
    const updateData = { companyName, companyLogoUrl, defaultCurrency };

    const newSettings = await Settings.findOneAndUpdate(
        { singleton: 'main_settings' },
        updateData,
        { new: true, upsert: true, runValidators: true }
    );

    await createAuditLog({
        actor: actorId,
        action: 'SETTINGS_UPDATED',
        ipAddress: ip,
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

    return newSettings;
};

module.exports = { getSettings, updateSettings };
