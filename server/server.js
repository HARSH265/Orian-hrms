const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');

// --- All Your Route Imports ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const leaveRoutes = require('./routes/leaveRoutes'); // Corrected from leaveRoute
const managerRoutes = require('./routes/managerRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const assetRoutes = require('./routes/assetRoutes');
const taskRoutes = require('./routes/taskRoutes');
const checklistTemplateRoutes = require('./routes/checklistTemplateRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const jobRoutes = require('./routes/jobRoutes');             
const referralRoutes = require('./routes/referralRoutes');
// --- 1. NEW: Import the upload routes ---
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const directoryRoutes = require('./routes/directoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

dotenv.config();
connectDB();

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000', 
    credentials: true, 
};

// --- Middlewares ---
app.use(cors(corsOptions)); 
app.use(express.json()); 
app.use(cookieParser()); 

// --- All Your API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/checklist-templates', checklistTemplateRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/jobs', jobRoutes);                             
app.use('/api/referrals', referralRoutes);
// --- 2. NEW: Add the upload route ---
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/directory', directoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// --- Central Error Handler ---
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));