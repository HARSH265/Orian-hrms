const mongoose = require('mongoose');

const ExpenseCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    trim: true,
    unique: true,
  },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

ExpenseCategorySchema.index({ name: 1 });
ExpenseCategorySchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('ExpenseCategory', ExpenseCategorySchema);
