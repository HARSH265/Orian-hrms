const mongoose = require('mongoose');
const encryptionPlugin = require('../utils/encryptionPlugin');

const sensitiveDataSchema = new mongoose.Schema({
    // One-to-one relationship with the User model
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, // Each user can only have one sensitive data document
    },
    salary: {
        type: Number,
        default: null,
    },
    bankInfo: {
        accountNumber: { type: String, default: '' },
        bankName: { type: String, default: '' },
        routingNumber: { type: String, default: '' },
    },
    nationalId: {
        type: String,
        default: '',
    },
}, { timestamps: true });

const encryptionKey = process.env.ENCRYPTION_SECRET_KEY;
if (!encryptionKey) {
    throw new Error('ENCRYPTION_SECRET_KEY is not defined in environment variables. Please check your .env file.');
}

// Attach the encryption plugin to the schema
sensitiveDataSchema.plugin(encryptionPlugin, {
    secret: encryptionKey,
    encryptedFields: ['salary', 'bankInfo', 'nationalId'],
});

// The name here should be singular and capitalized by convention
module.exports = mongoose.model('SensitiveData', sensitiveDataSchema);