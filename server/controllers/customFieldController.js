// In: server/controllers/customFieldController.js

const CustomField = require('../model/customField.model');
const { createAuditLog } = require('../services/auditLogService');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Create a new custom field definition
// @route   POST /api/custom-fields
exports.createCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await CustomField.create(req.body);
        
        await createAuditLog({
            actor: req.user.id, action: 'CUSTOM_FIELD_CREATED',
            details: { name: customField.name, type: customField.fieldType, appliesTo: customField.appliesTo }
        });

        res.status(201).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
    });

// @desc    Get all custom field definitions, optionally filtered by module
// @route   GET /api/custom-fields
exports.getCustomFields = asyncHandler(async (req, res, next) => {
    try {
        let query = {    });
        if (req.query.appliesTo) {
            query.appliesTo = req.query.appliesTo;
        }
        const customFields = await CustomField.find(query);
        res.status(200).json({ success: true, data: customFields });
    } catch (error) {
        next(error);
    }
    });

// @desc    Update a custom field definition
// @route   PUT /api/custom-fields/:id
exports.updateCustomField = asyncHandler(async (req, res, next) => {
    try {
        const customField = await CustomField.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        
        await createAuditLog({ /* ... */ });
        res.status(200).json({ success: true, data: customField });
    } catch (error) {
        next(error);
    }
    });

// @desc    Delete a custom field definition
// @route   DELETE /api/custom-fields/:id
exports.deleteCustomField = asyncHandler(async (req, res, next) => {
    // Note: In a true enterprise system, you would add a check here to prevent
    // deleting a field that is already in use by tasks.
    try {
        const customField = await CustomField.findById(req.params.id);
        if (!customField) {
            return res.status(404).json({ success: false, message: 'Custom field not found' });
        }
        
        await customField.remove();
        await createAuditLog({ /* ... */ });
        res.status(200).json({ success: true, message: 'Custom field deleted' });
    } catch (error) {
        next(error);
    }
};