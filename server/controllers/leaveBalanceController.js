const LeaveBalance = require('../model/leaveBalance.model');
const LeavePolicy = require('../model/leavePolicy.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get the logged-in user's current leave balances
exports.getMyBalances = asyncHandler(async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();
        const balances = await LeaveBalance.find({ employee: req.user.id, year: currentYear })
            .populate('leavePolicy', 'name'); // Show the policy name
        res.status(200).json({ success: true, data: balances });
    } catch (error) { next(error); }
    });

// @desc    Admin assigns a leave policy to an employee for a year
exports.assignPolicyToEmployee = asyncHandler(async (req, res, next) => {
    try {
        const { employeeId, leavePolicyId, year } = req.body;

        // --- CHECK 1: Validate the year format ---
        if (!year || typeof year !== 'number' || !String(year).match(/^\d{4}$/)) {
            return res.status(400).json({ success: false, message: 'A valid 4-digit year must be provided.' });
        }

        // --- NEW CHECK 2: Prevent assigning policies for past years ---
        const currentYear = new Date().getFullYear();
        if (year < currentYear) {
            return res.status(400).json({ success: false, message: `Cannot assign policies for a past year (${year}).` });
        }

        // --- NEW CHECK 3: Check for existing assignment before trying to create a new one ---
        const existingBalance = await LeaveBalance.findOne({
            employee: employeeId,
            leavePolicy: leavePolicyId,
            year: year
        });

        if (existingBalance) {
            // Use HTTP 409 Conflict for "already exists" errors
            return res.status(409).json({ 
                success: false, 
                message: 'This policy has already been assigned to this user for the selected year.' 
            });
        }
        // --- END OF NEW CHECKS ---

        const policy = await LeavePolicy.findById(leavePolicyId);
        if (!policy) {
            return res.status(404).json({ success: false, message: 'Policy not found' });
        }
        
        // Since we've confirmed it doesn't exist, we can now safely create it.
        // We use `create` instead of `findOneAndUpdate` because the intent is now clearly "new assignment".
        const newBalance = await LeaveBalance.create({
            employee: employeeId,
            leavePolicy: leavePolicyId,
            year: year,
            totalDays: policy.daysPerYear,
            daysTaken: 0 // Explicitly set to 0
        });

        // We need to populate the created document to send back to the frontend
        const populatedBalance = await LeaveBalance.findById(newBalance._id).populate('leavePolicy', 'name');

        res.status(201).json({ success: true, data: populatedBalance });

    } catch (error) { 
        // This will catch other potential errors, like invalid ObjectIDs
        next(error); 
    }
};