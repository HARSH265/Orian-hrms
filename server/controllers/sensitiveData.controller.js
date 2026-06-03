const { getSensitiveData, updateSensitiveData } = require('../services/sensitiveDataService');
const asyncHandler = require('../utils/asyncHandler');

exports.getSensitiveData = asyncHandler(async (req, res) => {
    const result = await getSensitiveData(req.params.userId, req.user._id, req.ip);
    if (result.error === 'not_found') {
        return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    res.status(200).json({ success: true, data: result.sensitiveData });
});

exports.updateSensitiveData = asyncHandler(async (req, res) => {
    const result = await updateSensitiveData(req.params.userId, req.body, req.user._id, req.ip);
    if (result.error === 'not_found') {
        return res.status(404).json({ success: false, message: 'Target user not found.' });
    }
    res.status(200).json({ success: true, data: result.newData });
});
