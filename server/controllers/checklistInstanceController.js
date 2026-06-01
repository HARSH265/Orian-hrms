const { getActiveChecklistInstances } = require('../services/checklistInstanceService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get active checklist instances for the logged-in user's scope (team or all)
// @route   GET /api/checklist-instances/active
// @access  Private (Manager, HR, Admin)
exports.getActiveChecklistInstances = asyncHandler(async (req, res, next) => {
    try {
        const instances = await getActiveChecklistInstances(req.user);
        res.status(200).json({ success: true, data: instances });
    } catch (error) {
        next(error);
    }
});
