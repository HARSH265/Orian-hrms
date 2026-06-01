const { createCustomField, getCustomFields, getCustomFieldById, updateCustomField, deleteCustomField } = require('../services/customFieldService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new custom field definition
// @route   POST /api/custom-fields
exports.createCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await createCustomField(req.body, req.user.id);
        res.status(201).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
});

// @desc    Get all custom field definitions, optionally filtered by module
// @route   GET /api/custom-fields
exports.getCustomFields = asyncHandler(async (req, res, next) => {
    try {
        const customFields = await getCustomFields(req.query);
        res.status(200).json({ success: true, data: customFields });
    } catch (error) {
        next(error);
    }
});

// @desc    Update a custom field definition
// @route   PUT /api/custom-fields/:id
exports.updateCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await updateCustomField(req.params.id, req.body);
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        res.status(200).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
});

// @desc    Delete a custom field definition
// @route   DELETE /api/custom-fields/:id
exports.deleteCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await getCustomFieldById(req.params.id);
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        await deleteCustomField(customField);
        res.status(200).json({ success: true, message: 'Custom field deleted' });
    } catch (error) {
        next(error);
    }
});
