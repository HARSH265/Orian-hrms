const mongoose = require('mongoose');

const ExpensePolicySchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Please add a policy name'], trim: true, unique: true },
  description: { type: String, trim: true },
  maxAmount: { type: Number, min: 0 },
  requiresReceipt: { type: Boolean, default: false },
  requiresManagerApproval: { type: Boolean, default: true },
  requiresAdminApproval: { type: Boolean, default: false },
  adminApprovalThreshold: { type: Number, default: 0, min: 0 },
  allowedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory' }],
  maxPerMonth: { type: Number, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ExpensePolicy', ExpensePolicySchema);
