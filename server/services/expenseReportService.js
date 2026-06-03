const ExpenseReport = require('../model/expenseReport.model');
const Expense = require('../model/expense.model');
const logger = require('../utils/logger');

const createReport = async (employeeId, { title, description, expenseIds }) => {
  if (!expenseIds || expenseIds.length === 0) {
    throw new Error('At least one expense must be selected for a report.');
  }

  const expenses = await Expense.find({ _id: { $in: expenseIds }, employee: employeeId }).lean();
  if (expenses.length !== expenseIds.length) {
    throw new Error('Some expenses were not found or do not belong to you.');
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currencies = [...new Set(expenses.map(e => e.currency))];
  const currency = currencies.length === 1 ? currencies[0] : 'USD';

  const report = await ExpenseReport.create({
    employee: employeeId,
    title,
    description,
    totalAmount,
    currency,
  });

  await Expense.updateMany(
    { _id: { $in: expenseIds } },
    { expenseReport: report._id }
  );

  return report;
};

const getMyReports = async (employeeId) => {
  return ExpenseReport.find({ employee: employeeId }).sort({ createdAt: -1 }).lean();
};

const getReportById = async (reportId, employeeId) => {
  const report = await ExpenseReport.findById(reportId).lean();
  if (!report || report.employee.toString() !== employeeId.toString()) return null;
  const expenses = await Expense.find({ expenseReport: reportId })
    .populate('category', 'name')
    .sort({ date: -1 })
    .lean();
  return { ...report, expenses };
};

const submitReport = async (reportId, employeeId) => {
  const report = await ExpenseReport.findById(reportId);
  if (!report) throw new Error('NOT_FOUND');
  if (report.employee.toString() !== employeeId.toString()) throw new Error('UNAUTHORIZED');
  if (report.status !== 'Draft') throw new Error('Report has already been submitted.');
  report.status = 'Submitted';
  report.submittedAt = new Date();
  await report.save();
  return report;
};

module.exports = { createReport, getMyReports, getReportById, submitReport };
