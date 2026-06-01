const jwt = require('jsonwebtoken');

const blacklistedTokens = new Map(); // jti -> expiry timestamp (ms)

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

function cleanupExpired() {
    const now = Date.now();
    for (const [jti, expiry] of blacklistedTokens) {
        if (expiry <= now) {
            blacklistedTokens.delete(jti);
        }
    }
}

const cleanupTimer = setInterval(cleanupExpired, CLEANUP_INTERVAL);
if (cleanupTimer.unref) {
    cleanupTimer.unref(); // don't keep process alive just for cleanup
}

function blacklistToken(token) {
    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.jti) return;

        const expiry = decoded.exp ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
        blacklistedTokens.set(decoded.jti, expiry);
    } catch {
        // ignore decode errors
    }
}

function isBlacklisted(jti) {
    if (!jti) return false;
    const expiry = blacklistedTokens.get(jti);
    if (!expiry) return false;
    if (expiry <= Date.now()) {
        blacklistedTokens.delete(jti);
        return false;
    }
    return true;
}

module.exports = { blacklistToken, isBlacklisted };
