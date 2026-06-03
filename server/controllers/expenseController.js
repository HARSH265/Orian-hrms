const asyncHandler = require('../utils/asyncHandler');
const expenseService = require('../services/expenseService');

exports.submitExpense = asyncHandler(async (req, res) => {
    const { date, category, currency, amount, description, receiptUrl, publicId } = req.body;
    const expense = await expenseService.submitExpense(
        { date, category, currency, amount, description, receiptUrl, publicId }, req.user, req.ip,
    );
    res.status(201).json({ success: true, data: expense });
});

exports.getMyExpenses = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await expenseService.getMyExpenses(req.user.id, { page, limit, status });
    res.json({ success: true, ...result });
});

exports.getTeamExpenses = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await expenseService.getTeamExpenses(req.user.id, { page, limit, status });
    res.json({ success: true, ...result });
});

exports.updateExpenseStatus = asyncHandler(async (req, res) => {
    const { status, managerNotes } = req.body;
    if (!['Approved', 'Denied'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status. Use "Approved" or "Denied".' });
    }
    const result = await expenseService.updateExpenseStatus(req.params.id, status, managerNotes, req.user.id, req.user.systemRole, req.ip);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

exports.getAllExpenses = asyncHandler(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await expenseService.getAllExpenses({ page, limit, status });
    res.json({ success: true, ...result });
});

exports.uploadReceipt = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    const result = await expenseService.uploadReceipt(req.params.id, req.file.path, req.file.filename, req.user.id);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

exports.reimburseExpense = asyncHandler(async (req, res) => {
    const result = await expenseService.reimburseExpense(req.params.id, req.user.id, req.ip);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    res.json({ success: true, message: 'Expense reimbursed.', data: result.data });
});

exports.deleteExpense = asyncHandler(async (req, res) => {
    const result = await expenseService.deleteExpense(req.params.id, req.user.id);
    if (result.error) return res.status(result.status).json({ success: false, message: result.error });
    res.json({ success: true, message: 'Expense deleted.' });
});

exports.exportCSV = asyncHandler(async (req, res) => {
    const csv = await expenseService.exportExpensesCSV(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
    res.send(csv);
});

exports.getSummary = asyncHandler(async (req, res) => {
    const employeeId = req.params.employeeId || req.user.id;
    const summary = await expenseService.getExpenseSummary(employeeId);
    res.json({ success: true, data: summary });
});
