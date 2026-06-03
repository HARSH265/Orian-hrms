const mongoose = require('mongoose');

const ExpenseReportSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: [true, 'Please add a report title'], trim: true },
  description: { type: String, trim: true },
  totalAmount: { type: Number, default: 0 },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN', 'Other'],
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Denied'],
    default: 'Draft',
  },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
}, { timestamps: true });

ExpenseReportSchema.index({ employee: 1, createdAt: -1 });
ExpenseReportSchema.index({ status: 1 });

module.exports = mongoose.model('ExpenseReport', ExpenseReportSchema);
