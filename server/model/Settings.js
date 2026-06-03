const mongoose = require('mongoose');

const FeatureTogglesSchema = new mongoose.Schema({
    chatEnabled: { type: Boolean, default: true },
    kudosEnabled: { type: Boolean, default: true },
    surveysEnabled: { type: Boolean, default: true },
    referralsEnabled: { type: Boolean, default: true },
    documentManagementEnabled: { type: Boolean, default: true },
}, { _id: false });

const LeaveConfigSchema = new mongoose.Schema({
    carryOverEnabled: { type: Boolean, default: false },
    carryOverDays: { type: Number, default: 5, min: 0 },
    carryOverExpiryMonths: { type: Number, default: 3, min: 1 },
    proRataEnabled: { type: Boolean, default: true },
    managerApprovalRequired: { type: Boolean, default: true },
    hrCanApproveLeave: { type: Boolean, default: true },
    allowHalfDayRequests: { type: Boolean, default: false },
    minNoticeDays: { type: Number, default: 0, min: 0 },
    maxPendingRequests: { type: Number, default: 0, min: 0 },
}, { _id: false });

const AttendanceConfigSchema = new mongoose.Schema({
    gracePeriodMinutes: { type: Number, default: 15, min: 0 },
    autoClockoutMinutes: { type: Number, default: 0, min: 0 },
    workStartTime: { type: String, default: '09:00', match: /^\d{2}:\d{2}$/ },
    workEndTime: { type: String, default: '18:00', match: /^\d{2}:\d{2}$/ },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    requireLocation: { type: Boolean, default: false },
    allowOvertime: { type: Boolean, default: true },
    weeklyHoursCap: { type: Number, default: 0, min: 0 },
}, { _id: false });

const SecurityConfigSchema = new mongoose.Schema({
    passwordMinLength: { type: Number, default: 6, min: 4 },
    passwordRequireSpecialChar: { type: Boolean, default: false },
    passwordExpiryDays: { type: Number, default: 0, min: 0 },
    sessionTimeoutMinutes: { type: Number, default: 0, min: 0 },
    maxLoginAttempts: { type: Number, default: 5, min: 0 },
    lockoutDurationMinutes: { type: Number, default: 30, min: 0 },
    twoFactorRequired: { type: Boolean, default: false },
    twoFactorEnforcedRoles: { type: [String], default: [] },
}, { _id: false });

const NotificationConfigSchema = new mongoose.Schema({
    emailNotificationsEnabled: { type: Boolean, default: true },
    pushNotificationsEnabled: { type: Boolean, default: true },
    dailyDigestEnabled: { type: Boolean, default: false },
    digestTime: { type: String, default: '09:00', match: /^\d{2}:\d{2}$/ },
    quietHoursEnabled: { type: Boolean, default: false },
    quietHoursStart: { type: String, default: '22:00', match: /^\d{2}:\d{2}$/ },
    quietHoursEnd: { type: String, default: '07:00', match: /^\d{2}:\d{2}$/ },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: [true, 'Company Name is required.'],
        default: 'Orion HRMS',
    },
    companyLogoUrl: {
        type: String,
        default: '',
    },
    defaultCurrency: {
        type: String,
        default: 'USD',
        match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO 4217 code (e.g., USD, EUR).'],
    },
    timezone: {
        type: String,
        default: 'UTC',
    },
    dateFormat: {
        type: String,
        default: 'YYYY-MM-DD',
    },
    offboardingTemplateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChecklistTemplate',
        default: null,
    },
    features: { type: FeatureTogglesSchema, default: () => ({}) },
    leave: { type: LeaveConfigSchema, default: () => ({}) },
    attendance: { type: AttendanceConfigSchema, default: () => ({}) },
    security: { type: SecurityConfigSchema, default: () => ({}) },
    notifications: { type: NotificationConfigSchema, default: () => ({}) },
    singleton: {
        type: String,
        default: 'main_settings',
        unique: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
