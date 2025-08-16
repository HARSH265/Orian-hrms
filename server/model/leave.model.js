const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date'],
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date'],
    },
    reason: {
        type: String,
        required: [true, 'Please provide a reason for your leave'],
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Denied', 'Withdrawn'],
        default: 'Pending',
    },
    managerNotes: { 
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);