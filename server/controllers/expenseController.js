const Expense = require('../model/expense.model');
const User = require('../model/user');
const { createNotification } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Submit a new expense claim
// @route   POST /api/expenses
// @access  Private (Employee)
exports.submitExpense = asyncHandler(async (req, res, next) => {
    try {
        const { date, category, amount, description } = req.body;
        const employee = req.user.id;
        const expense = await Expense.create({ employee, date, category, amount, description });

         // Notify the manager that a new claim has been submitted.
        if (employee.manager) {
            await createNotification({
                recipient: employee.manager,
                sender: employee.id,
                message: `${employee.name} submitted an expense claim for $${amount}.`,
                link: '/expenses/approvals', // Link to the approval page
                type: 'Expense',
            },req);
        }

        res.status(201).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get the logged-in user's expense history
// @route   GET /api/expenses/my-expenses
// @access  Private (Employee)
exports.getMyExpenses = asyncHandler(async (req, res, next) => {
    try {
        const expenses = await Expense.find({ employee: req.user.id }).sort({ date: -1 });
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        next(error);
    }
    });

// --- MANAGER FUNCTIONS ---

// @desc    Get all expense claims for the manager's team
// @route   GET /api/expenses/team-expenses
// @access  Private (Manager+)
exports.getTeamExpenses = asyncHandler(async (req, res, next) => {
    try {
        const teamMembers = await User.find({ manager: req.user.id }).select('_id');
        const teamMemberIds = teamMembers.map(member => member._id);

        const expenses = await Expense.find({ employee: { $in: teamMemberIds } })
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, count: expenses.length, data: expenses });
    } catch (error) {
        next(error);
    }
    });

// @desc    Update the status of an expense claim (Approve/Deny)
// @route   PUT /api/expenses/:id/status
// @access  Private (Manager+)
exports.updateExpenseStatus = asyncHandler(async (req, res, next) => {
    try {
        const { status, managerNotes } = req.body;
        if (!['Approved', 'Denied'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }

        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense claim not found.' });
        }
        
        const employee = await User.findById(expense.employee);
        const loggedInUser = req.user;

        // Security Check: Must be direct manager OR an admin
        const isDirectManager = employee.manager && (employee.manager.toString() === loggedInUser.id.toString());
        const isAdmin = loggedInUser.role === 'hr' || loggedInUser.role === 'super-admin';
        
        if (!isDirectManager && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this claim.' });
        }

        expense.status = status;
        if (managerNotes) {
            expense.managerNotes = managerNotes;
        }
        await expense.save();

        // Notify the employee about the decision on their claim.
        await createNotification({
            recipient: employee._id,
            sender: req.user.id,
            message: `Your expense claim for $${expense.amount} has been ${status.toLowerCase()}.`,
            link: '/expenses',
            type: 'Expense',
        },req);

        res.status(200).json({ success: true, data: expense });
    } catch (error) {
        next(error);
    }
    });

// ... at the end of the file ...

/**
 * @desc    Get ALL expense claims in the system (for Admin view)
 * @route   GET /api/expenses/all
 * @access  Private (HR, Super-Admin)
 */
exports.getAllExpenses = asyncHandler(async (req, res, next) => {
    try {
        const allExpenses = await Expense.find({})
            .populate('employee', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: allExpenses.length, data: allExpenses });
    } catch (error) {
        next(error);
    }
};