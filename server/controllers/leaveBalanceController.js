const asyncHandler = require('../utils/asyncHandler');
const { getMyBalances, getAdminBalances, assignPolicyToEmployee, bulkAssignPolicy } = require('../services/leaveBalanceService');

exports.getMyBalances = asyncHandler(async (req, res, next) => {
    try {
        const { year } = req.query;
        const balances = await getMyBalances(req.user.id, year ? parseInt(year) : undefined);
        res.status(200).json({ success: true, data: balances });
    } catch (error) { next(error); }
});

exports.getAdminBalances = asyncHandler(async (req, res, next) => {
    try {
        const { policyId, year, departmentId } = req.query;
        const balances = await getAdminBalances({ policyId, year: year ? parseInt(year) : undefined, departmentId });
        res.status(200).json({ success: true, data: balances });
    } catch (error) { next(error); }
});

exports.assignPolicyToEmployee = asyncHandler(async (req, res, next) => {
    try {
        const { employeeId, leavePolicyId, year } = req.body;
        if (!year || typeof year !== 'number') {
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
        if (error.message.startsWith('Cannot assign')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
});

exports.bulkAssignPolicy = asyncHandler(async (req, res, next) => {
    try {
        const { leavePolicyId, year, employeeIds, departmentId } = req.body;
        if (!year) return res.status(400).json({ success: false, message: 'Year is required.' });
        if (!leavePolicyId) return res.status(400).json({ success: false, message: 'Leave policy ID is required.' });
        if (!employeeIds && !departmentId) {
            return res.status(400).json({ success: false, message: 'Provide employeeIds or departmentId.' });
        }
        const result = await bulkAssignPolicy({ leavePolicyId, year, employeeIds, departmentId, userId: req.user.id });
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ success: false, message: 'Policy not found' });
        next(error);
    }
});
