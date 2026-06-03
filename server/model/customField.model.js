const mongoose = require('mongoose');

const CustomFieldSchema = new mongoose.Schema({
    name: { // The display name of the field, e.g., "Client Name"
        type: String,
        required: true,
        trim: true,
    },
    fieldType: { // The type of input to render
        type: String,
        required: true,
        enum: ['Text', 'Number', 'Date', 'Select', 'MultiSelect'],
    },
    appliesTo: { // Which module this field belongs to
        type: String,
        required: true,
        enum: ['Task', 'User', 'Expense'], // Can be expanded later
    },
    options: { // An array of strings for 'Select' or 'MultiSelect' types
        type: [String],
        default: [],
    },
    isRequired: {
        type: Boolean,
        default: false,
    },
    order: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

CustomFieldSchema.index({ name: 1, appliesTo: 1 }, { unique: true });
CustomFieldSchema.index({ appliesTo: 1, order: 1 });

module.exports = mongoose.model('CustomField', CustomFieldSchema);