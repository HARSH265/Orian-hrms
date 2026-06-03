const CustomField = require('../model/customField.model');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const createCustomField = async (data, userId) => {
    if (['Select', 'MultiSelect'].includes(data.fieldType) && (!data.options || data.options.length === 0)) {
        throw Object.assign(new Error('Options are required for Select/MultiSelect field types.'), { statusCode: 400 });
    }

    const customField = await CustomField.create(data);

    await createAuditLog({
        actor: userId,
        action: 'CUSTOM_FIELD_CREATED',
        details: { name: customField.name, type: customField.fieldType, appliesTo: customField.appliesTo }
    });

    return customField;
};

const getCustomFields = async (query) => {
    let filter = {};
    if (query.appliesTo) {
        filter.appliesTo = query.appliesTo;
    }
    const customFields = await CustomField.find(filter).sort({ order: 1 });
    return customFields;
};

const getCustomFieldById = async (id) => {
    const customField = await CustomField.findById(id);
    return customField;
};

const updateCustomField = async (id, data, userId) => {
    if (data.fieldType && ['Select', 'MultiSelect'].includes(data.fieldType) && (!data.options || data.options.length === 0)) {
        throw Object.assign(new Error('Options are required for Select/MultiSelect field types.'), { statusCode: 400 });
    }

    const customField = await CustomField.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });

    if (customField) {
        await createAuditLog({
            actor: userId,
            action: 'CUSTOM_FIELD_UPDATED',
            details: { name: customField.name, type: customField.fieldType, appliesTo: customField.appliesTo }
        });
    }

    return customField;
};

const deleteCustomField = async (id, userId) => {
    const customField = await CustomField.findByIdAndDelete(id);
    if (!customField) return null;

    await createAuditLog({
        actor: userId,
        action: 'CUSTOM_FIELD_DELETED',
        details: { name: customField.name, type: customField.fieldType, appliesTo: customField.appliesTo }
    });

    return customField;
};

module.exports = {
    createCustomField,
    getCustomFields,
    getCustomFieldById,
    updateCustomField,
    deleteCustomField,
};
