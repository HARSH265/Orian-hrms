const Expense = require('../model/expense.model');
const User = require('../model/user');
const { createNotification } = require('./notificationService');
const { auditLogService } = require('./index');
const logger = require('../utils/logger');
const { parsePagination, buildPagination } = require('../utils/pagination');
const { getDescendantIds } = require('../utils/teamTree');

const CSV_HEADERS = 'Date,Category,Amount,Currency,Description,Status,Receipt\n';

const submitExpense = async (data, user, ip) => {
    const { date, category, currency, amount, description, receiptUrl, publicId } = data;
    const expense = await Expense.create({
        employee: user.id,
        date,
        category: category || undefined,
        currency: currency || 'USD',
        amount,
        description,
        receiptUrl: receiptUrl || undefined,
        publicId: publicId || undefined,
    });

    const populated = await Expense.findById(expense._id)
        .populate('category', 'name')
        .lean();

    auditLogService.createAuditLog({ actor: user.id, action: 'EXPENSE_CREATED', target: { id: expense._id, type: 'Expense' }, ipAddress: ip });

    if (user.manager) {
        try {
            await createNotification({
                recipient: user.manager,
                sender: user.id,
                message: `${user.name} submitted an expense claim for $${amount}.`,
                link: '/expenses/approvals',
                type: 'Expense',
            });
        } catch (notifErr) {
            logger.error('[ExpenseService] Failed to notify manager for new expense:', notifErr);
        }
    }

    return populated;
};

const getMyExpenses = async (userId, { page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = { employee: userId };
    if (status) query.status = status;
    const [expenses, total] = await Promise.all([
        Expense.find(query)
            .populate('category', 'name')
            .sort({ date: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
        Expense.countDocuments(query),
    ]);
    const enriched = expenses.map(e => ({ ...e, categoryName: e.category?.name || 'N/A' }));
    return { data: enriched, pagination: buildPagination(total, p, l) };
};

const getTeamExpenses = async (managerId, { page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const teamMemberIds = await getDescendantIds(managerId);
    const query = { employee: { $in: teamMemberIds } };
    if (status) query.status = status;
    const [expenses, total] = await Promise.all([
        Expense.find(query)
            .populate('employee', 'name email')
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
        Expense.countDocuments(query),
    ]);
    return { data: expenses, pagination: buildPagination(total, p, l) };
};

const updateExpenseStatus = async (expenseId, status, managerNotes, userId, userRole, ip) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) return { error: 'Expense claim not found.', status: 404 };

    const employee = await User.findById(expense.employee);
    const isDirectManager = employee.manager && (employee.manager.toString() === userId);
    const isAdmin = userRole === 'hr' || userRole === 'super-admin';

    if (!isDirectManager && !isAdmin) return { error: 'Not authorized to update this claim.', status: 403 };
    if (expense.employee.toString() === userId) return { error: 'Cannot approve or deny your own expense.', status: 403 };
    if (expense.status === 'Approved' || expense.status === 'Denied') return { error: `This expense has already been ${expense.status.toLowerCase()}.`, status: 400 };

    const step = { approver: userId, status, date: new Date(), notes: managerNotes || '' };

    if (status === 'Denied') {
        expense.status = 'Denied';
        expense.approvalChain.push(step);
        if (managerNotes) expense.managerNotes = managerNotes;
        await expense.save();
        auditLogService.createAuditLog({ actor: userId, action: 'EXPENSE_DENIED', target: { id: expense._id, type: 'Expense' }, ipAddress: ip });
        try {
            await createNotification({
                recipient: employee._id, sender: userId,
                message: `Your expense claim for $${expense.amount} has been denied.${managerNotes ? ` Reason: ${managerNotes}` : ''}`,
                link: '/expenses', type: 'Expense',
            });
        } catch (notifErr) {
            logger.error('[ExpenseService] Failed to notify employee for denial:', notifErr);
        }
        return { data: expense };
    }

    if (status === 'Approved') {
        if (isDirectManager) expense.status = 'ManagerApproved';
        if (isAdmin) expense.status = 'Approved';
        expense.approvalChain.push(step);
        if (managerNotes) expense.managerNotes = managerNotes;
        await expense.save();

        auditLogService.createAuditLog({
            actor: userId,
            action: expense.status === 'Approved' ? 'EXPENSE_APPROVED' : 'EXPENSE_MANAGER_APPROVED',
            target: { id: expense._id, type: 'Expense' },
            ipAddress: ip,
        });

        const statusDisplay = expense.status === 'ManagerApproved' ? 'approved by manager' : 'approved';
        try {
            await createNotification({
                recipient: employee._id, sender: userId,
                message: `Your expense claim for $${expense.amount} has been ${statusDisplay}.`,
                link: '/expenses', type: 'Expense',
            });
        } catch (notifErr) {
            logger.error('[ExpenseService] Failed to notify employee for approval:', notifErr);
        }
    }

    return { data: expense };
};

const getAllExpenses = async ({ page, limit, status } = {}) => {
    const { page: p, limit: l, skip } = parsePagination({ page, limit });
    const query = {};
    if (status) query.status = status;
    const [allExpenses, total] = await Promise.all([
        Expense.find(query)
            .populate('employee', 'name email')
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(l)
            .lean(),
        Expense.countDocuments(query),
    ]);
    return { data: allExpenses, pagination: buildPagination(total, p, l) };
};

const uploadReceipt = async (expenseId, receiptUrl, publicId, userId) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) return { error: 'Expense claim not found.', status: 404 };
    if (expense.employee.toString() !== userId.toString()) return { error: 'Not authorized to upload receipt for this expense.', status: 403 };
    expense.receiptUrl = receiptUrl;
    expense.publicId = publicId;
    await expense.save();
    auditLogService.createAuditLog({ actor: userId, action: 'EXPENSE_RECEIPT_UPLOADED', target: { id: expense._id, type: 'Expense' } });
    return { data: expense };
};

const reimburseExpense = async (expenseId, userId, ip) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) return { error: 'Expense claim not found.', status: 404 };
    if (expense.status !== 'Approved') return { error: 'Only approved expenses can be reimbursed.', status: 400 };
    if (expense.reimbursedAt) return { error: 'This expense has already been reimbursed.', status: 400 };

    expense.reimbursedAt = new Date();
    expense.reimbursedBy = userId;
    await expense.save();
    auditLogService.createAuditLog({ actor: userId, action: 'EXPENSE_REIMBURSED', target: { id: expense._id, type: 'Expense' }, ipAddress: ip });

    const employee = await User.findById(expense.employee);
    try {
        await createNotification({
            recipient: employee._id, sender: userId,
            message: `Your expense claim for $${expense.amount} has been reimbursed.`,
            link: '/expenses', type: 'Expense',
        });
    } catch (notifErr) {
        logger.error('[ExpenseService] Failed to notify employee for reimbursement:', notifErr);
    }

    return { data: expense };
};

const deleteExpense = async (expenseId, userId) => {
    const expense = await Expense.findById(expenseId);
    if (!expense) return { error: 'Expense claim not found.', status: 404 };
    if (expense.employee.toString() !== userId.toString()) return { error: 'Not authorized to delete this expense.', status: 403 };
    if (expense.status !== 'Pending') return { error: 'Only pending expenses can be deleted.', status: 400 };
    await Expense.findByIdAndDelete(expenseId);
    auditLogService.createAuditLog({ actor: userId, action: 'EXPENSE_DELETED', target: { id: expenseId, type: 'Expense' } });
    return { data: null };
};

const exportExpensesCSV = async (query = {}) => {
    const expenses = await Expense.find(query)
        .populate('employee', 'name email')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .lean();

    let csv = CSV_HEADERS;
    for (const e of expenses) {
        const cat = e.category?.name || 'N/A';
        const receipt = e.receiptUrl || '';
        csv += `${new Date(e.date).toISOString().split('T')[0]},${cat},${e.amount},${e.currency || 'USD'},"${e.description.replace(/"/g, '""')}",${e.status},${receipt}\n`;
    }
    return csv;
};

const getExpenseSummary = async (employeeId) => {
    const [totalCount, approvedCount, pendingCount, deniedCount, totalAmount, monthlyData] = await Promise.all([
        Expense.countDocuments({ employee: employeeId }),
        Expense.countDocuments({ employee: employeeId, status: 'Approved' }),
        Expense.countDocuments({ employee: employeeId, status: { $in: ['Pending', 'ManagerApproved'] } }),
        Expense.countDocuments({ employee: employeeId, status: 'Denied' }),
        Expense.aggregate([
            { $match: { employee: employeeId, status: 'Approved' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Expense.aggregate([
            { $match: { employee: employeeId } },
            { $group: { _id: { $month: '$date' }, count: { $sum: 1 }, total: { $sum: '$amount' } } },
            { $sort: { '_id': 1 } },
        ]),
    ]);

    return { totalCount, approvedCount, pendingCount, deniedCount, totalApprovedAmount: totalAmount[0]?.total || 0, monthlyData };
};

module.exports = {
    submitExpense, getMyExpenses, getTeamExpenses, updateExpenseStatus, getAllExpenses,
    uploadReceipt, reimburseExpense, deleteExpense, exportExpensesCSV, getExpenseSummary,
};
