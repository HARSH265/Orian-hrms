const Expense = require('../model/expense.model');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const logger = require('../utils/logger');

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

const getMyExpenses = async (userId) => {
    const expenses = await Expense.find({ employee: userId }).sort({ date: -1 });
    return expenses;
};

const getTeamExpenses = async (managerId) => {
    const teamMembers = await User.find({ manager: managerId }).select('_id');
    const teamMemberIds = teamMembers.map(member => member._id);

    const expenses = await Expense.find({ employee: { $in: teamMemberIds } })
        .populate('employee', 'name email')
        .sort({ createdAt: -1 });
    return expenses;
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

const getAllExpenses = async () => {
    const allExpenses = await Expense.find({})
        .populate('employee', 'name email')
        .sort({ createdAt: -1 });
    return allExpenses;
};

module.exports = {
    submitExpense,
    getMyExpenses,
    getTeamExpenses,
    updateExpenseStatus,
    getAllExpenses,
};
