const Expense = require('../model/expense.model');
const logger = require('../utils/logger');

const RECURRING_INTERVAL_MS = {
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  quarterly: 91 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

async function processRecurringExpenses() {
  try {
    const now = new Date();
    const dueExpenses = await Expense.find({
      isRecurring: true,
      nextDueDate: { $lte: now },
      status: { $in: ['Approved', 'Pending'] },
    }).populate('employee').lean();

    for (const original of dueExpenses) {
      const newExpense = await Expense.create({
        employee: original.employee._id || original.employee,
        date: now,
        category: original.category,
        currency: original.currency || 'USD',
        amount: original.amount,
        description: `${original.description} (Recurring)`,
        receiptUrl: original.receiptUrl,
        isRecurring: true,
        recurringInterval: original.recurringInterval,
        nextDueDate: new Date(now.getTime() + (RECURRING_INTERVAL_MS[original.recurringInterval] || RECURRING_INTERVAL_MS.monthly)),
      });

      // Update original's next due date
      await Expense.findByIdAndUpdate(original._id, {
        nextDueDate: newExpense.nextDueDate,
      });

      logger.info(`[RecurringExpense] Created recurring expense ${newExpense._id} from ${original._id}`);
    }
  } catch (err) {
    logger.error('[RecurringExpense] Error processing recurring expenses:', err);
  }
}

function startRecurringExpenseJob() {
  // Run every 6 hours
  const INTERVAL = 6 * 60 * 60 * 1000;
  processRecurringExpenses(); // Run immediately on startup
  setInterval(processRecurringExpenses, INTERVAL);
  logger.info('[RecurringExpense] Job started, checking every 6 hours.');
}

module.exports = { startRecurringExpenseJob };
