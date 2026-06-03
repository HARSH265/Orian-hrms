const LeaveBalance = require('../model/leaveBalance.model');
const LeavePolicy = require('../model/leavePolicy.model');
const User = require('../model/user');
const logger = require('../utils/logger');

const initYearlyBalances = async () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const existingCount = await LeaveBalance.countDocuments({ year: nextYear });
    if (existingCount > 0) {
        logger.info(`[LeaveBalanceJob] Balances for ${nextYear} already exist (${existingCount} records). Skipping.`);
        return;
    }

    const activePolicies = await LeavePolicy.find({ isArchived: false }).lean();
    if (activePolicies.length === 0) {
        logger.info('[LeaveBalanceJob] No active leave policies found. Skipping.');
        return;
    }

    const activeUsers = await User.find({ isActive: true }).select('_id').lean();
    if (activeUsers.length === 0) {
        logger.info('[LeaveBalanceJob] No active users found. Skipping.');
        return;
    }

    const bulkOps = [];
    for (const policy of activePolicies) {
        for (const user of activeUsers) {
            bulkOps.push({
                updateOne: {
                    filter: { employee: user._id, leavePolicy: policy._id, year: nextYear },
                    update: { $setOnInsert: { totalDays: policy.daysPerYear, daysTaken: 0 } },
                    upsert: true,
                },
            });
        }
    }

    if (bulkOps.length > 0) {
        const result = await LeaveBalance.bulkWrite(bulkOps, { ordered: false });
        logger.info(`[LeaveBalanceJob] Initialized ${result.upsertedCount} balances for ${nextYear} (${activePolicies.length} policies x ${activeUsers.length} users).`);
    }
};

const startLeaveBalanceJob = (intervalMs = 24 * 60 * 60 * 1000) => {
    logger.info('Leave balance job started (interval: 24h — checks if next year balances need init)');
    initYearlyBalances().catch(err => logger.error('[LeaveBalanceJob] Initial run failed:', err.message));
    setInterval(() => {
        initYearlyBalances().catch(err => logger.error('[LeaveBalanceJob] Run failed:', err.message));
    }, intervalMs);
};

module.exports = { startLeaveBalanceJob };
