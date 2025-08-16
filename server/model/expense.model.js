const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: [true, 'Please add the date of the expense'],
    },
    category: {
        type: String,
        required: [true, 'Please select a category'],
        enum: ['Travel', 'Meal', 'Supplies', 'Training', 'Other'],
    },
    amount: {
        type: Number,
        required: [true, 'Please enter the expense amount'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Denied'],
        default: 'Pending',
    },
    // We will add receiptUrl later when we tackle file uploads
    // receiptUrl: { type: String },
    managerNotes: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', ExpenseSchema);