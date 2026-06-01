const SensitiveData = require('../model/sensitiveData.model');
const User = require('../model/user');
const { createAuditLog } = require('../services/auditLogService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get sensitive data for a specific user
// @route   GET /api/sensitive-data/:userId
// @access  Private/Super-Admin
exports.getSensitiveData = asyncHandler(async (req, res, next) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        let sensitiveData = await SensitiveData.findOne({ user: req.params.userId });

        // If no data exists, return a structured empty response.
        if (!sensitiveData) {
            sensitiveData = { salary: null, bankInfo: {}, nationalId: ''     });
        }
        
        // --- AUDIT LOG ---
        await createAuditLog({
            actor: req.user._id,
            action: 'SENSITIVE_DATA_VIEWED',
            ipAddress: req.ip,
            target: { id: targetUser._id, type: 'User' },
            details: `Viewed sensitive data for user: ${targetUser.email}`
        });

        res.status(200).json({ success: true, data: sensitiveData });
    } catch (error) {
        next(error);
    }
    });

// @desc    Update (or create) sensitive data for a specific user
// @route   PUT /api/sensitive-data/:userId
// @access  Private/Super-Admin
exports.updateSensitiveData = asyncHandler(async (req, res, next) => {
    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }
        
        const { salary, bankInfo, nationalId } = req.body;
        const updateData = { salary, bankInfo, nationalId, user: req.params.userId     });

        // Capture the "before" state for the audit log
        const oldData = await SensitiveData.findOne({ user: req.params.userId }).lean();

        // Use findOneAndUpdate with upsert to either create or update the document.
        const newData = await SensitiveData.findOneAndUpdate(
            { user: req.params.userId },
            updateData,
            { new: true, upsert: true, runValidators: true }
        );

        // --- AUDIT LOG ---
        // We only log the fields that have changed for clarity.
        const changes = {    });
        if (oldData?.salary !== newData.salary) changes.salary = { from: oldData?.salary, to: newData.salary     });
        if (oldData?.nationalId !== newData.nationalId) changes.nationalId = 'updated';
        if (JSON.stringify(oldData?.bankInfo) !== JSON.stringify(newData.bankInfo)) changes.bankInfo = 'updated';

        await createAuditLog({
            actor: req.user._id,
            action: 'SENSITIVE_DATA_UPDATED',
            ipAddress: req.ip,
            target: { id: targetUser._id, type: 'User' },
            details: {
                message: `Updated sensitive data for user: ${targetUser.email}`,
                changes: changes
            }
        });

        res.status(200).json({ success: true, data: newData });
    } catch (error) {
        next(error);
    }
    });

// Export the functions
module.exports = {
    getSensitiveData: exports.getSensitiveData,
    updateSensitiveData: exports.updateSensitiveData,
};