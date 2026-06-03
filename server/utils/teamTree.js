const User = require('../model/user');

const getDescendantIds = async (managerId) => {
    const allIds = [];
    let queue = [managerId];
    while (queue.length > 0) {
        const directReports = await User.find({ manager: { $in: queue } }).select('_id').lean();
        const ids = directReports.map(u => u._id);
        if (ids.length === 0) break;
        allIds.push(...ids);
        queue = ids;
    }
    return allIds;
};

module.exports = { getDescendantIds };
