const asyncHandler = require('../utils/asyncHandler');
const { getChatDirectory } = require('../services/directoryService');

exports.getChatDirectory = asyncHandler(async (req, res, next) => {
    try {
        const permittedUsers = await getChatDirectory(req.user);
        res.status(200).json({ success: true, count: permittedUsers.length, data: permittedUsers });
    } catch (error) {
        next(error);
    }
});
