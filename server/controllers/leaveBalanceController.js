const asyncHandler = require('../utils/asyncHandler');
const { getMyBalances, assignPolicyToEmployee } = require('../services/leaveBalanceService');

exports.getMyBalances = asyncHandler(async (req, res, next) => {
    try {
        const balances = await getMyBalances(req.user.id);
        res.status(200).json({ success: true, data: balances });
    } catch (error) {
        next(error);
    }
});

exports.assignPolicyToEmployee = asyncHandler(async (req, res, next) => {
    try {
        const { employeeId, leavePolicyId, year } = req.body;

        if (!year || typeof year !== 'number' || !String(year).match(/^\d{4}$/)) {
            return res.status(400).json({ success: false, message: 'A valid 4-digit year must be provided.' });
        }

        const populatedBalance = await assignPolicyToEmployee({ employeeId, leavePolicyId, year });
        res.status(201).json({ success: true, data: populatedBalance });
    } catch (error) {
        if (error.message === 'ALREADY_EXISTS') {
            return res.status(409).json({ success: false, message: 'This policy has already been assigned to this user for the selected year.' });
        }
        if (error.message === 'NOT_FOUND') {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }
        if (error.message.startsWith('Cannot assign policies for a past year')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});
