const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
        validate: {
            validator: function (v) {
                return v <= new Date();
            },
            message: 'Date cannot be in the future',
        },
    },
    clockInTime: {
        type: Date, // This will be a full ISODate with timestamp
    },
    clockOutTime: {
        type: Date, // Full ISODate timestamp, null if still clocked in
    },
    status: {
        type: String,
        enum: ['Present', 'On Leave', 'Holiday', 'Absent'],
        default: 'Present',
    },
    totalHours: { // Calculated in hours
        type: Number,
        default: 0,
    },
    notes: { // For manual admin corrections
        type: String,
        trim: true,
    }
}, { timestamps: true });

// --- CRITICAL: This compound index ensures one record per employee per day ---
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);