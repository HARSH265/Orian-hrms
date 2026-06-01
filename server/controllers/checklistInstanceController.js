const ChecklistInstance = require('../model/checklistInstance.model');
const User = require('../model/user');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get active checklist instances for the logged-in user's scope (team or all)
// @route   GET /api/checklist-instances/active
// @access  Private (Manager, HR, Admin)
exports.getActiveChecklistInstances = asyncHandler(async (req, res, next) => {
    try {
        let query = { status: 'In Progress'     });

        // If the user is a manager, only show checklists for their direct reports.
        if (req.user.role === 'manager') {
            const teamMembers = await User.find({ manager: req.user.id }).select('_id');
            const teamMemberIds = teamMembers.map(member => member._id);
            query.targetUser = { $in: teamMemberIds     });
        }
        // HR and super-admins will see all active checklists (no extra filter needed).

        const instances = await ChecklistInstance.find(query)
            .limit(10) // Limit to 10 for a dashboard widget to keep it performant
            .populate('template', 'name')
            .populate('targetUser', 'name profilePictureUrl')
            .populate('generatedTasks', 'status') // We only need the status to calculate progress
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: instances });

    } catch (error) {
        next(error);
    }
    });