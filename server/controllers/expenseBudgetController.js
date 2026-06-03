const asyncHandler = require('../utils/asyncHandler');
const budgetService = require('../services/expenseBudgetService');

exports.getBudget = asyncHandler(async (req, res, next) => {
    try {
        const { year, month } = req.query;
        const budgets = await budgetService.getDepartmentBudget(req.params.departmentId, parseInt(year) || new Date().getFullYear(), month ? parseInt(month) : null);
        res.status(200).json({ success: true, data: budgets });
    } catch (error) {
        next(error);
    }
});

exports.setBudget = asyncHandler(async (req, res, next) => {
    try {
        const budget = await budgetService.setBudget(req.body);
        res.status(200).json({ success: true, data: budget });
    } catch (error) {
        next(error);
    }
});

exports.getBudgetSummary = asyncHandler(async (req, res, next) => {
    try {
        const summary = await budgetService.getBudgetSummary(req.params.departmentId, parseInt(req.query.year) || new Date().getFullYear());
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
});
