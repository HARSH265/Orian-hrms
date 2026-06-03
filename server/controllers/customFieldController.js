const { createCustomField, getCustomFields, getCustomFieldById, updateCustomField, deleteCustomField } = require('../services/customFieldService');
const asyncHandler = require('../utils/asyncHandler');

exports.createCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await createCustomField(req.body, req.user.id);
        res.status(201).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
});

exports.getCustomFields = asyncHandler(async (req, res, next) => {
    try {
        const customFields = await getCustomFields(req.query);
        res.status(200).json({ success: true, data: customFields });
    } catch (error) {
        next(error);
    }
});

exports.updateCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await updateCustomField(req.params.id, req.body, req.user.id);
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        res.status(200).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
});

exports.deleteCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await deleteCustomField(req.params.id, req.user.id);
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        res.status(200).json({ success: true, message: 'Custom field deleted' });
    } catch (error) {
        next(error);
    }
});
