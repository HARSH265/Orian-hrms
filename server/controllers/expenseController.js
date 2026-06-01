const asyncHandler = require('../utils/asyncHandler');
const {
    submitExpense,
    getMyExpenses,
    getTeamExpenses,
    updateExpenseStatus,
    getAllExpenses,
} = require('../services/expenseService');

exports.submitExpense = asyncHandler(async (req, res, next) => {
    try {
        const { date, category, amount, description } = req.body;
        const expense = await submitExpense(
            { date, category, amount, description, employee: req.user },
            req
        );
        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
});

exports.getMyExpenses = asyncHandler(async (req, res, next) => {
    try {
        const expenses = await getMyExpenses(req.user.id);
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        next(error);
    }
});

exports.getTeamExpenses = asyncHandler(async (req, res, next) => {
    try {
        const expenses = await getTeamExpenses(req.user.id);
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        next(error);
    }
});

exports.updateExpenseStatus = asyncHandler(async (req, res, next) => {
    try {
        const { status, managerNotes } = req.body;
        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const result = await updateExpenseStatus(req.params.id, status, managerNotes, req.user, req);
        if (result.error) {
            return res.status(result.status).json({ success: false, message: result.error });
        }
        res.status(200).json({ success: true, data: result.data });
    } catch (error) {
        next(error);
    }
});

exports.getAllExpenses = asyncHandler(async (req, res, next) => {
    try {
        const allExpenses = await getAllExpenses();
        res.status(200).json({ success: true, count: allExpenses.length, data: allExpenses });
    } catch (error) {
        next(error);
    }
});
