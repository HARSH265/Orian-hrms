const ExpenseBudget = require('../model/expenseBudget.model');
const logger = require('../utils/logger');

const getDepartmentBudget = async (departmentId, year, month) => {
  const query = { department: departmentId, year };
  if (month) query.month = month;
  return ExpenseBudget.find(query).lean();
};

const setBudget = async ({ department, year, month, amount, currency, notes }) => {
  const existing = await ExpenseBudget.findOne({ department, year, month: month || null });
  if (existing) {
    existing.amount = amount;
    existing.currency = currency || existing.currency;
    if (notes !== undefined) existing.notes = notes;
    await existing.save();
    return existing;
  }
  return ExpenseBudget.create({ department, year, month: month || null, amount, currency: currency || 'USD', notes });
};

const getBudgetSummary = async (departmentId, year) => {
  const budgets = await ExpenseBudget.find({ department: departmentId, year }).lean();
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  return { budgets, totalBudget, totalSpent, remaining: totalBudget - totalSpent };
};

const updateSpent = async (departmentId, year, amount) => {
  // Update all monthly budgets for the department/year proportionally
  const budgets = await ExpenseBudget.find({ department: departmentId, year });
  for (const budget of budgets) {
    budget.spent = (budget.spent || 0) + (budget.month ? amount / Math.max(budgets.filter(b => b.month).length, 1) : amount);
    await budget.save();
  }
};

module.exports = { getDepartmentBudget, setBudget, getBudgetSummary, updateSpent };
