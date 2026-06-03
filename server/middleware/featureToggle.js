const Settings = require('../model/Settings');

let cachedSettings = null;
let lastFetch = 0;
const CACHE_TTL = 60000;

const getFeatures = async () => {
    const now = Date.now();
    if (cachedSettings && now - lastFetch < CACHE_TTL) return cachedSettings;

    let settings = await Settings.findOne({ singleton: 'main_settings' }).lean();
    if (!settings) {
        settings = await Settings.create({ companyName: 'Orion HRMS', singleton: 'main_settings' });
    }

    cachedSettings = settings.features || {};
    lastFetch = now;
    return cachedSettings;
};

const clearFeatureCache = () => {
    cachedSettings = null;
    lastFetch = 0;
};

const featureEnabled = (...featureNames) => {
    return async (req, res, next) => {
        const features = await getFeatures();
        const missing = featureNames.filter(name => !features[`${name}Enabled`]);
        if (missing.length > 0) {
            return res.status(403).json({
                success: false,
                message: `Feature(s) disabled: ${missing.join(', ')}. Contact your administrator.`,
            });
        }
        next();
    };
};

module.exports = { featureEnabled, clearFeatureCache, getFeatures };
