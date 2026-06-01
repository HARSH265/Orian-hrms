const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leavePolicy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeavePolicy',
        required: true,
    },
    year: { // The calendar year this balance applies to
        type: Number,
        required: true,
    },
    totalDays: { // The total entitlement for the year (from the policy)
        type: Number,
        required: true,
    },
    daysTaken: {
        type: Number,
        default: 0,
    },
    // The remaining balance can be calculated on the fly (totalDays - daysTaken)
}, { timestamps: true });

// Ensure an employee can only have one balance per policy per year
LeaveBalanceSchema.index({ employee: 1, leavePolicy: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);