const User = require('../model/user');

/**
 * @desc    Get a flat list of all active employees for a simple directory view.
 * @route   GET /api/directory/users
 * @access  Private (All logged-in users)
 */
exports.getUsersForDirectory = async (req, res, next) => {
    try {
        // This is our "source of truth" query. It gets all necessary, populated data.
        const users = await User.find({ isActive: true })
            .select('name email jobTitle profilePictureUrl department manager')
            .populate('department', 'name')
            .populate('manager', 'name')
            .sort({ name: 1 });

        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get all active users formatted specifically for building an org chart on the frontend.
 * @route   GET /api/directory/org-chart
 * @access  Private (All logged-in users)
 */
exports.getDataForOrgChart = async (req, res, next) => {
    try {

        const users = await User.find({ isActive: true })
            .select('name jobTitle manager profilePictureUrl role');

        

        if (!users || users.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const orgChartData = users.map(user => ({
            id: user._id.toString(),
            pid: user.manager ? user.manager.toString() : null,
            name: user.name,
            title: user.jobTitle || user.role,
            avatar: user.profilePictureUrl,
        }));
        
        

        res.status(200).json({ success: true, data: orgChartData });
    } catch (error) {
        console.error('--- !!! ERROR IN getDataForOrgChart !!! ---');
        console.error(error);
        next(error);
    }
};