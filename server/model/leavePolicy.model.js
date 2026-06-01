const mongoose = require('mongoose');

const LeavePolicySchema = new mongoose.Schema({
    name: { // e.g., "Annual Vacation", "Sick Leave"
        type: String,
        required: [true, 'Please add a policy name'],
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
    },
    daysPerYear: {
        type: Number,
        required: [true, 'Please specify the number of days per year for this policy'],
        min: 0,
    },
    requiresAttachment: { // 👈 NEW: For sick leave, etc.
        type: Boolean,
        default: false,
    },
    // We can add more advanced fields later, like 'accrualType' (monthly/yearly)
    // or 'canCarryForward' (boolean)
    isArchived: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

module.exports = mongoose.model('LeavePolicy', LeavePolicySchema);