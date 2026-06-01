const express = require('express');
const router = express.Router();

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
router.use('/users', userRoutes);
router.use('/leave', leaveRoutes);
router.use('/manager', managerRoutes);
router.use('/departments', departmentRoutes);
router.use('/admin', adminRoutes);
router.use('/announcements', announcementRoutes);
router.use('/assets', assetRoutes);
router.use('/tasks', taskRoutes);
router.use('/checklist-templates', checklistTemplateRoutes);
router.use('/checklist-instances', checklistInstanceRoutes);
router.use('/expenses', expenseRoutes);
router.use('/jobs', jobRoutes);
router.use('/referrals', referralRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/skills', skillRoutes);
router.use('/reviews', reviewRoutes);
router.use('/kudos', kudosRoutes);
router.use('/surveys', surveyRoutes);
router.use('/documents', documentRoutes); 
router.use('/upload', uploadRoutes);
router.use('/leave-policies', leavePolicyRoutes);
router.use('/leave-balances', leaveBalanceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/directory', directoryRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/sensitive-data', sensitiveDataRoutes);
router.use('/chat', chatRoutes);
router.use('/custom-fields', customFieldRoutes); 
router.use('/roles', roleRoutes);

module.exports = router;