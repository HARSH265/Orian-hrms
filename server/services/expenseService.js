const Expense = require('../model/expense.model');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');

const submitExpense = async (data, req) => {
    const { date, category, amount, description, employee } = data;
    const expense = await Expense.create({ employee: employee.id, date, category, amount, description });

    if (employee.manager) {
        await createNotification({
            recipient: employee.manager,
            sender: employee.id,
            message: `${employee.name} submitted an expense claim for $${amount}.`,
            link: '/expenses/approvals',
            type: 'Expense',
        }, req);
    }

    return expense;
};

const getMyExpenses = async (userId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { employee: userId };
    const [expenses, total] = await Promise.all([
        Expense.find(query).sort({ date: -1 }).skip(skip).limit(l),
        Expense.countDocuments(query)
    ]);
    return { data: expenses, pagination: buildPagination(total, p, l) };
};

const getTeamExpenses = async (managerId, { page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const teamMembers = await User.find({ manager: managerId }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);
    const query = { employee: { $in: teamMemberIds } };
    const [expenses, total] = await Promise.all([
        Expense.find(query)
            .populate('employee', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Expense.countDocuments(query)
    ]);
    return { data: expenses, pagination: buildPagination(total, p, l) };
};

const updateExpenseStatus = async (expenseId, status, managerNotes, loggedInUser, req) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
        return { error: 'Expense claim not found.', status: 404 };
    }

    const employee = await User.findById(expense.employee);

    const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
    const isAdmin = loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin';

    if (!isDirectManager && !isAdmin) {
        return { error: 'Not authorized to update this claim.', status: 403 };
    }

    // Prevent self-approval
    if (expense.employee.toString() === loggedInUser.id.toString()) {
        throw new Error('Cannot approve or deny your own expense.');
    }

    expense.status = status;
    if (managerNotes) {
        expense.managerNotes = managerNotes;
    }
    await expense.save();

    await createNotification({
        recipient: employee._id,
        sender: loggedInUser.id,
        message: `Your expense claim for $${expense.amount} has been ${status.toLowerCase()}.`,
        link: '/expenses',
        type: 'Expense',
    }, req);

    return { data: expense };
};

const getAllExpenses = async ({ page, limit } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const [allExpenses, total] = await Promise.all([
        Expense.find({})
            .populate('employee', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l),
        Expense.countDocuments()
    ]);
    return { data: allExpenses, pagination: buildPagination(total, p, l) };
};

module.exports = {
    submitExpense,
    getMyExpenses,
    getTeamExpenses,
    updateExpenseStatus,
    getAllExpenses,
};
