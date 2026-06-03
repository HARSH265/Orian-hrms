const mongoose = require('mongoose');

const ExpenseBudgetSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true,
  },
  year: { type: Number, required: true },
  month: { type: Number, min: 1, max: 12 },
  amount: { type: Number, required: [true, 'Please enter the budget amount'], min: 0 },
  spent: { type: Number, default: 0 },
  currency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN', 'Other'],
    default: 'USD',
  },
  notes: { type: String, trim: true },
}, { timestamps: true });

ExpenseBudgetSchema.index({ department: 1, year: 1, month: 1 }, { unique: true });
ExpenseBudgetSchema.virtual('remaining').get(function () {
  return this.amount - this.spent;
});

module.exports = mongoose.model('ExpenseBudget', ExpenseBudgetSchema);
