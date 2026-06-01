const express = require('express');
const router = express.Router();
const { writeLimiter } = require('../middleware/rateLimitMiddleware');

// Import all your individual route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const leaveRoutes = require('./leaveRoutes');
const managerRoutes = require('./managerRoutes');
const departmentRoutes = require('./departmentRoutes');
const adminRoutes = require('./adminRoutes');
const announcementRoutes = require('./announcementRoutes');
const assetRoutes = require('./assetRoutes');
const taskRoutes = require('./taskRoutes');
const checklistTemplateRoutes = require('./checklistTemplateRoutes');
const checklistInstanceRoutes = require('./checklistInstanceRoutes');
const expenseRoutes = require('./expenseRoutes');
const jobRoutes = require('./jobRoutes');
const referralRoutes = require('./referralRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const skillRoutes = require('./skillRoutes');
const kudosRoutes = require('./kudos.routes.js');
const surveyRoutes = require('./survey.routes.js');
const documentRoutes = require('./document.routes.js'); 
const uploadRoutes = require('./upload.routes.js');
const roleRoutes = require('./roleRoutes');

const notificationRoutes = require('./notificationRoutes');
const reportRoutes = require('./reportRoutes');
const directoryRoutes = require('./directoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reviewRoutes = require('./reviewRoutes');
const leavePolicyRoutes = require('./leavePolicyRoutes');
const leaveBalanceRoutes = require('./leaveBalanceRoutes');
const settingsRoutes = require('./settings.routes.js');
const sensitiveDataRoutes = require('./sensitiveData.routes.js');
const chatRoutes = require('./chatRoutes');
const customFieldRoutes = require('./customFieldRoutes');


// Mount all routes onto the main router
router.use('/auth', authRoutes);
router.use('/users', writeLimiter, userRoutes);
router.use('/leave', writeLimiter, leaveRoutes);
router.use('/manager', writeLimiter, managerRoutes);
router.use('/departments', writeLimiter, departmentRoutes);
router.use('/admin', writeLimiter, adminRoutes);
router.use('/announcements', writeLimiter, announcementRoutes);
router.use('/assets', writeLimiter, assetRoutes);
router.use('/tasks', writeLimiter, taskRoutes);
router.use('/checklist-templates', writeLimiter, checklistTemplateRoutes);
router.use('/checklist-instances', writeLimiter, checklistInstanceRoutes);
router.use('/expenses', writeLimiter, expenseRoutes);
router.use('/jobs', writeLimiter, jobRoutes);
router.use('/referrals', writeLimiter, referralRoutes);
router.use('/attendance', writeLimiter, attendanceRoutes);
router.use('/skills', writeLimiter, skillRoutes);
router.use('/reviews', writeLimiter, reviewRoutes);
router.use('/kudos', writeLimiter, kudosRoutes);
router.use('/surveys', writeLimiter, surveyRoutes);
router.use('/documents', writeLimiter, documentRoutes); 
router.use('/upload', writeLimiter, uploadRoutes);
router.use('/leave-policies', writeLimiter, leavePolicyRoutes);
router.use('/leave-balances', writeLimiter, leaveBalanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/directory', directoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', writeLimiter, settingsRoutes);
router.use('/sensitive-data', writeLimiter, sensitiveDataRoutes);
router.use('/chat', chatRoutes);
router.use('/custom-fields', writeLimiter, customFieldRoutes); 
router.use('/roles', writeLimiter, roleRoutes);

module.exports = router;