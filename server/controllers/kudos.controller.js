const asyncHandler = require('../utils/asyncHandler');
const { createKudos, getAllKudos, getUserKudos } = require('../services/kudosService');

exports.createKudos = asyncHandler(async (req, res, next) => {
    try {
        const { recipientId, message, companyValue } = req.body;
        const result = await createKudos(req.user, recipientId, message, companyValue, req);
        if (result.error) {
            return res.status(result.status).json({ success: false, message: result.error });
        }
        res.status(201).json({ success: true, data: result.data });
    } catch (error) {
        next(error);
    }
});

exports.getAllKudos = asyncHandler(async (req, res, next) => {
    try {
        const kudos = await getAllKudos();
        res.status(200).json({ success: true, count: kudos.length, data: kudos });
    } catch (error) {
        next(error);
    }
});

exports.getUserKudos = asyncHandler(async (req, res, next) => {
    try {
        const kudos = await getUserKudos(req.params.userId);
        res.status(200).json({ success: true, count: kudos.length, data: kudos });
    } catch (error) {
        next(error);
    }
});

module.exports = {
    createKudos: exports.createKudos,
    getAllKudos: exports.getAllKudos,
    getUserKudos: exports.getUserKudos,
};
