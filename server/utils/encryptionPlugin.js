const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret) {
    return crypto.createHash('sha256').update(secret).digest();
}

function encryptValue(value, secret) {
    if (value === null || value === undefined) return value;
    const key = deriveKey(secret);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const aad = Buffer.from('');
    cipher.setAAD(aad);
    const input = Buffer.from(JSON.stringify(value), 'utf8');
    const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        iv: iv.toString('hex'),
        data: encrypted.toString('hex'),
        tag: authTag.toString('hex'),
    };
}

function decryptValue(encryptedObj, secret) {
    if (!encryptedObj || typeof encryptedObj !== 'object' || !encryptedObj.iv) return encryptedObj;
    const key = deriveKey(secret);
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const authTag = Buffer.from(encryptedObj.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    const aad = Buffer.from('');
    decipher.setAAD(aad);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedObj.data, 'hex')), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
}

function encryptionPlugin(schema, options) {
    const { secret, encryptedFields } = options;

    if (!secret) throw new Error('encryptionPlugin requires a "secret" option');
    if (!encryptedFields || !encryptedFields.length) throw new Error('encryptionPlugin requires "encryptedFields"');

    schema.eachPath(function (path) {
        if (encryptedFields.includes(path)) {
            schema.path(path).set(function (value) {
                if (value && typeof value === 'object' && value.iv && value.data && value.tag) {
                    return value;
                }
                return encryptValue(value, secret);
            });
        }
    });

    schema.post('init', function (doc) {
        for (const field of encryptedFields) {
            if (doc[field]) {
                try {
                    doc[field] = decryptValue(doc[field], secret);
                } catch (e) {
                    console.error(`Failed to decrypt field "${field}":`, e.message);
                }
            }
        }
    });
}

module.exports = encryptionPlugin;
