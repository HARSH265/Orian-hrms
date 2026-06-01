const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'Company Name is required.'],
        default: 'Orion HRMS',
    },
    companyLogoUrl: {
        type: String,
        default: '',
    },
    // We can add more settings later, like timezone or currency
    defaultCurrency: {
        type: String,
        default: 'USD',
    },
       offboardingTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChecklistTemplate',
        default: null
    },
    // A unique field to ensure we can always find this single document
    singleton: {
        type: String,
        default: 'main_settings',
        unique: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);