const NotificationPreference = require('../model/NotificationPreference');

const getDefaults = (userId) => ({
    user: userId,
    types: {
        Leave: true, Task: true, Expense: true, Announcement: true,
        General: true, Kudos: true, Document: true, Asset: true, System: true,
    },
    email: true, push: true,
});

const getPreferences = async (userId) => {
    let prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs) {
        prefs = await NotificationPreference.create(getDefaults(userId));
    }
    return prefs;
};

const updatePreferences = async (userId, updates) => {
    const prefs = await getPreferences(userId);

    if (updates.types && typeof updates.types === 'object') {
        for (const [key, value] of Object.entries(updates.types)) {
            if (key in prefs.types) {
                prefs.types[key] = value;
            }
        }
    }
    if (typeof updates.email === 'boolean') prefs.email = updates.email;
    if (typeof updates.push === 'boolean') prefs.push = updates.push;

    await prefs.save();
    return prefs;
};

const isTypeEnabled = async (userId, type) => {
    const prefs = await NotificationPreference.findOne({ user: userId });
    if (!prefs) return true;
    return prefs.types[type] !== false;
};

module.exports = { getPreferences, updatePreferences, isTypeEnabled };
