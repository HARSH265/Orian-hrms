// Centralized service exports
// Import shared services from here: const { notificationService, auditLogService } = require('../services');

const notificationService = require('./notificationService');
const auditLogService = require('./auditLogService');
const checklistService = require('./checklistService');

module.exports = {
    notificationService,
    auditLogService,
    checklistService,
};
