const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leavePolicy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeavePolicy',
        required: [true, 'A leave type must be specified'],
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
    attachments: [{ 
        fileName: String,
        filePath: String, 
    }],
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    managerNotes: { 
        type: String,
        default: ''
    }
}, { timestamps: true });

LeaveSchema.index({ employee: 1, createdAt: -1 });
LeaveSchema.index({ status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Leave', LeaveSchema);