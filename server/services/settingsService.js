const Settings = require('../model/Settings');
const { createAuditLog } = require('./auditLogService');
const { clearFeatureCache } = require('../middleware/featureToggle');

const getSettings = async () => {
    let settings = await Settings.findOne({ singleton: 'main_settings' }).lean();
    if (!settings) {
        settings = await Settings.create({ companyName: 'Orion HRMS', singleton: 'main_settings' });
    }
    return settings;
};

const updateSettings = async (updateFields, actorId, ip) => {
    const oldSettings = await Settings.findOne({ singleton: 'main_settings' }).lean();

    const flatAllowed = ['companyName', 'companyLogoUrl', 'defaultCurrency', 'timezone', 'dateFormat', 'offboardingTemplateId'];
    const groupKeys = ['features', 'leave', 'attendance', 'security', 'notifications'];

    const updateData = {};
    for (const key of flatAllowed) {
        if (updateFields[key] !== undefined) updateData[key] = updateFields[key];
    }
    for (const key of groupKeys) {
        if (updateFields[key] !== undefined && typeof updateFields[key] === 'object') {
            for (const [subKey, value] of Object.entries(updateFields[key])) {
                updateData[`${key}.${subKey}`] = value;
            }
        }
    }

    const newSettings = await Settings.findOneAndUpdate(
        { singleton: 'main_settings' },
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
    );

    const before = {};
    const after = {};
    for (const [key, value] of Object.entries(updateData)) {
        const keyParts = key.split('.');
        if (keyParts.length === 1) {
            before[key] = oldSettings?.[key];
            after[key] = value;
        } else {
            const [group, sub] = keyParts;
            before[key] = oldSettings?.[group]?.[sub];
            after[key] = value;
        }
    }

    clearFeatureCache();

    await createAuditLog({
        actor: actorId,
        action: 'SETTINGS_UPDATED',
        ipAddress: ip,
        details: { before, after },
    });

    return newSettings;
};

const getConfigGroup = async (groupName) => {
    const validGroups = ['features', 'leave', 'attendance', 'security', 'notifications'];
    if (!validGroups.includes(groupName)) return null;

    let settings = await Settings.findOne({ singleton: 'main_settings' }).lean();
    if (!settings) {
        settings = await Settings.create({ companyName: 'Orion HRMS', singleton: 'main_settings' });
    }
    return settings[groupName] || {};
};

const updateConfigGroup = async (groupName, data, actorId, ip) => {
    const validGroups = ['features', 'leave', 'attendance', 'security', 'notifications'];
    if (!validGroups.includes(groupName)) throw new Error(`Invalid config group: ${groupName}`);

    const oldSettings = await Settings.findOne({ singleton: 'main_settings' }).lean();
    const oldGroup = oldSettings?.[groupName] || {};

    const updateData = {};
    for (const [key, value] of Object.entries(data)) {
        updateData[`${groupName}.${key}`] = value;
    }

    const newSettings = await Settings.findOneAndUpdate(
        { singleton: 'main_settings' },
        { $set: updateData },
        { new: true, upsert: true, runValidators: true }
    );

    clearFeatureCache();

    await createAuditLog({
        actor: actorId,
        action: `SETTINGS_${groupName.toUpperCase()}_UPDATED`,
        ipAddress: ip,
        details: { before: oldGroup, after: newSettings[groupName] },
    });

    return newSettings[groupName];
};

module.exports = { getSettings, updateSettings, getConfigGroup, updateConfigGroup };
