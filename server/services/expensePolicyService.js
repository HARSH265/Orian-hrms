const ExpensePolicy = require('../model/expensePolicy.model');
const Expense = require('../model/expense.model');
const logger = require('../utils/logger');

const getAllPolicies = async () => {
  return ExpensePolicy.find({ isActive: true }).lean();
};

const createPolicy = async (data) => {
  return ExpensePolicy.create(data);
};

const updatePolicy = async (id, data) => {
  return ExpensePolicy.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

const deletePolicy = async (id) => {
  return ExpensePolicy.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
};

const validateExpenseAgainstPolicies = async (expenseData, employee) => {
  const policies = await ExpensePolicy.find({ isActive: true }).lean();
  const errors = [];

  for (const policy of policies) {
    if (policy.maxAmount && expenseData.amount > policy.maxAmount) {
      errors.push(`Amount exceeds policy limit of ${policy.maxAmount} (${policy.name}).`);
    }
    if (policy.maxPerMonth) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthTotal = await Expense.aggregate([
        { $match: { employee: employee._id, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const currentMonthTotal = (monthTotal[0]?.total || 0) + expenseData.amount;
      if (currentMonthTotal > policy.maxPerMonth) {
        errors.push(`Monthly expense limit of ${policy.maxPerMonth} exceeded (${policy.name}).`);
      }
    }
    if (policy.requiresReceipt && !expenseData.receiptUrl) {
      errors.push(`Receipt is required by policy: ${policy.name}.`);
    }
  }

  return errors;
};

module.exports = { getAllPolicies, createPolicy, updatePolicy, deletePolicy, validateExpenseAgainstPolicies };
