const CustomField = require('../model/customField.model');
const { createAuditLog } = require('./auditLogService');
const logger = require('../utils/logger');

const createCustomField = async (data, userId) => {
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
    const customFields = await CustomField.find(filter);
    return customFields;
};

const getCustomFieldById = async (id) => {
    const customField = await CustomField.findById(id);
    return customField;
};

const updateCustomField = async (id, data) => {
    const customField = await CustomField.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
    return customField;
};

const deleteCustomField = async (customField) => {
    await customField.remove();
};

module.exports = {
    createCustomField,
    getCustomFields,
    getCustomFieldById,
    updateCustomField,
    deleteCustomField,
};
