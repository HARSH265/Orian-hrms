const mongoose = require('mongoose');

const ApprovalStepSchema = new mongoose.Schema({
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['Pending', 'Approved', 'Denied'], default: 'Pending' },
  date: { type: Date },
  notes: { type: String, trim: true },
}, { _id: false });

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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
    },
    categoryName: {
        type: String,
    },
    amount: {
        type: Number,
        required: [true, 'Please enter the expense amount'],
        min: [0, 'Amount must be positive'],
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN', 'Other'],
        default: 'USD',
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'ManagerApproved', 'AdminApproved', 'Approved', 'Denied'],
        default: 'Pending',
    },
    approvalChain: [ApprovalStepSchema],
    receiptUrl: { type: String },
    publicId: { type: String },
    expenseReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseReport',
        default: null,
    },
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    },
    nextDueDate: { type: Date },
    reimbursedAt: { type: Date },
    reimbursedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managerNotes: {
        type: String,
        trim: true,
    }
}, { timestamps: true });

ExpenseSchema.index({ employee: 1, date: -1 });
ExpenseSchema.index({ status: 1 });
ExpenseSchema.index({ expenseReport: 1 });
ExpenseSchema.index({ category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);