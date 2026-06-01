const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const User = require('../model/user');
const Department = require('../model/department.model');
const Role = require('../model/role.model');
const Task = require('../model/task.model');
const LeavePolicy = require('../model/leavePolicy.model');
const LeaveBalance = require('../model/leaveBalance.model');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Department.deleteMany({});
        await Role.deleteMany({});
        await Task.deleteMany({});
        await LeavePolicy.deleteMany({});
        await LeaveBalance.deleteMany({});
        logger.info('Cleared existing data.');

        // ========== DEPARTMENTS ==========
        const departments = await Department.insertMany([
            { name: 'Engineering', description: 'Software development and technical operations' },
            { name: 'Human Resources', description: 'People management, hiring, and culture' },
            { name: 'Marketing', description: 'Brand, growth, and communications' },
            { name: 'Finance', description: 'Accounting, budgeting, and financial planning' },
            { name: 'Design', description: 'Product design, UI/UX, and creative' },
            { name: 'Sales', description: 'Revenue generation and client relations' },
        ]);
        const [engineering, hr, marketing, finance, design, sales] = departments;
        logger.info('Departments created.');

        // ========== USERS ==========
        const plainPassword = 'Harshit@1234';

        // Super Admin
        const superAdmin = await User.create({
            name: 'Harshit Pratap',
            email: 'harshit@orion.com',
            password: plainPassword,
            systemRole: 'super-admin',
            department: engineering._id,
            jobTitle: 'Chief Technology Officer',
            phone: '+91 9876543210',
            address: 'Bangalore, India',
            needsWelcomeWizard: false,
            employmentInfo: { employeeId: 'EMP001', hireDate: new Date('2022-01-15'), employmentType: 'Full-time', workLocation: 'Office' },
            personalInfo: { dateOfBirth: new Date('1990-05-20'), gender: 'Male', nationality: 'Indian', maritalStatus: 'Single' },
        });

        // HR Manager
        const hrManager = await User.create({
            name: 'Priya Sharma',
            email: 'priya@orion.com',
            password: plainPassword,
            systemRole: 'hr',
            department: hr._id,
            jobTitle: 'HR Manager',
            manager: superAdmin._id,
            phone: '+91 9876543211',
            needsWelcomeWizard: false,
            employmentInfo: { employeeId: 'EMP002', hireDate: new Date('2022-03-10'), employmentType: 'Full-time', workLocation: 'Office' },
        });

        // Managers
        const manager1 = await User.create({
            name: 'Rahul Verma',
            email: 'rahul@orion.com',
            password: plainPassword,
            systemRole: 'manager',
            department: engineering._id,
            jobTitle: 'Engineering Manager',
            manager: superAdmin._id,
            phone: '+91 9876543212',
            needsWelcomeWizard: false,
            employmentInfo: { employeeId: 'EMP003', hireDate: new Date('2022-02-01'), employmentType: 'Full-time', workLocation: 'Office' },
        });

        const manager2 = await User.create({
            name: 'Neha Gupta',
            email: 'neha@orion.com',
            password: plainPassword,
            systemRole: 'manager',
            department: marketing._id,
            jobTitle: 'Marketing Manager',
            manager: superAdmin._id,
            phone: '+91 9876543213',
            needsWelcomeWizard: false,
            employmentInfo: { employeeId: 'EMP004', hireDate: new Date('2022-04-15'), employmentType: 'Full-time', workLocation: 'Remote' },
        });

        // Employees
        const employees = await User.insertMany([
            {
                name: 'Amit Singh',
                email: 'amit@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: engineering._id,
                jobTitle: 'Senior Software Engineer',
                manager: manager1._id,
                phone: '+91 9876543214',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP005', hireDate: new Date('2023-01-10'), employmentType: 'Full-time', workLocation: 'Office' },
            },
            {
                name: 'Sneha Patel',
                email: 'sneha@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: engineering._id,
                jobTitle: 'Software Engineer',
                manager: manager1._id,
                phone: '+91 9876543215',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP006', hireDate: new Date('2023-06-01'), employmentType: 'Full-time', workLocation: 'Remote' },
            },
            {
                name: 'Vikram Joshi',
                email: 'vikram@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: design._id,
                jobTitle: 'UI/UX Designer',
                manager: manager2._id,
                phone: '+91 9876543216',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP007', hireDate: new Date('2023-03-20'), employmentType: 'Full-time', workLocation: 'Office' },
            },
            {
                name: 'Anjali Reddy',
                email: 'anjali@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: marketing._id,
                jobTitle: 'Content Strategist',
                manager: manager2._id,
                phone: '+91 9876543217',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP008', hireDate: new Date('2023-09-01'), employmentType: 'Full-time', workLocation: 'Hybrid' },
            },
            {
                name: 'Karan Mehta',
                email: 'karan@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: finance._id,
                jobTitle: 'Financial Analyst',
                manager: hrManager._id,
                phone: '+91 9876543218',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP009', hireDate: new Date('2024-01-15'), employmentType: 'Full-time', workLocation: 'Office' },
            },
            {
                name: 'Pooja Nair',
                email: 'pooja@orion.com',
                password: plainPassword,
                systemRole: 'employee',
                department: sales._id,
                jobTitle: 'Sales Executive',
                manager: manager2._id,
                phone: '+91 9876543219',
                needsWelcomeWizard: false,
                employmentInfo: { employeeId: 'EMP010', hireDate: new Date('2024-02-01'), employmentType: 'Full-time', workLocation: 'Office' },
            },
        ]);
        logger.info('Users created.');

        // Update department managers
        await Department.findByIdAndUpdate(engineering._id, { manager: manager1._id });
        await Department.findByIdAndUpdate(hr._id, { manager: hrManager._id });
        await Department.findByIdAndUpdate(marketing._id, { manager: manager2._id });

        // ========== TASKS ==========
        const [amit, sneha, vikram, anjali, karan, pooja] = employees;
        await Task.insertMany([
            {
                title: 'Implement user authentication module',
                description: 'Build JWT-based auth with refresh tokens, 2FA support, and role-based access control.',
                status: 'In Progress',
                priority: 'High',
                assignees: [amit._id, sneha._id],
                creator: manager1._id,
                dueDate: new Date('2026-06-15'),
                timeEstimate: 40,
            },
            {
                title: 'Design new dashboard UI',
                description: 'Create wireframes and high-fidelity mockups for the analytics dashboard.',
                status: 'Done',
                priority: 'Medium',
                assignees: [vikram._id],
                creator: manager2._id,
                dueDate: new Date('2026-05-20'),
                timeEstimate: 20,
            },
            {
                title: 'Q2 Marketing Campaign Plan',
                description: 'Draft the marketing plan for Q2 including social media, email, and paid campaigns.',
                status: 'In Progress',
                priority: 'High',
                assignees: [anjali._id],
                creator: manager2._id,
                dueDate: new Date('2026-06-10'),
                timeEstimate: 30,
            },
            {
                title: 'Database schema optimization',
                description: 'Add missing indexes, optimize query performance, and set up monitoring.',
                status: 'To Do',
                priority: 'Medium',
                assignees: [amit._id],
                creator: manager1._id,
                dueDate: new Date('2026-06-30'),
                timeEstimate: 16,
            },
            {
                title: 'Prepare Q1 financial report',
                description: 'Compile and analyze Q1 financial data for board presentation.',
                status: 'Done',
                priority: 'High',
                assignees: [karan._id],
                creator: superAdmin._id,
                dueDate: new Date('2026-04-15'),
                timeEstimate: 24,
            },
            {
                title: 'Sales pipeline review',
                description: 'Review and update the current sales pipeline, forecast Q2 revenue.',
                status: 'In Progress',
                priority: 'Medium',
                assignees: [pooja._id],
                creator: manager2._id,
                dueDate: new Date('2026-06-08'),
                timeEstimate: 12,
            },
            {
                title: 'API rate limiting implementation',
                description: 'Add rate limiting middleware to protect against abuse and DDoS attacks.',
                status: 'blocked',
                priority: 'High',
                assignees: [sneha._id],
                creator: manager1._id,
                dueDate: new Date('2026-06-12'),
                timeEstimate: 8,
            },
            {
                title: 'Employee onboarding checklist update',
                description: 'Revise the onboarding checklist to include new security training module.',
                status: 'To Do',
                priority: 'Low',
                assignees: [hrManager._id],
                creator: superAdmin._id,
                dueDate: new Date('2026-06-20'),
                timeEstimate: 4,
            },
        ]);
        logger.info('Tasks created.');

        // ========== LEAVE POLICIES ==========
        const policies = await LeavePolicy.insertMany([
            { name: 'Annual Leave', description: 'Paid time off for vacation', daysPerYear: 20, requiresAttachment: false },
            { name: 'Sick Leave', description: 'Leave for health reasons', daysPerYear: 10, requiresAttachment: true },
            { name: 'Work From Home', description: 'Remote work days', daysPerYear: 12, requiresAttachment: false },
            { name: 'Maternity Leave', description: 'Maternity leave for new mothers', daysPerYear: 180, requiresAttachment: true },
        ]);
        const [annualLeave, sickLeave, wfh, maternityLeave] = policies;
        logger.info('Leave policies created.');

        // ========== LEAVE BALANCES ==========
        const allUsers = [superAdmin, hrManager, manager1, manager2, ...employees];
        const leaveBalanceDocs = [];
        for (const user of allUsers) {
            leaveBalanceDocs.push(
                { employee: user._id, leavePolicy: annualLeave._id, year: 2026, totalDays: 20, daysTaken: Math.floor(Math.random() * 5) },
                { employee: user._id, leavePolicy: sickLeave._id, year: 2026, totalDays: 10, daysTaken: Math.floor(Math.random() * 3) },
                { employee: user._id, leavePolicy: wfh._id, year: 2026, totalDays: 12, daysTaken: Math.floor(Math.random() * 6) },
            );
        }
        await LeaveBalance.insertMany(leaveBalanceDocs);
        logger.info('Leave balances created.');

        logger.info('\n--- SEED COMPLETE ---');
        logger.info('Super Admin Login: harshit@orion.com / Harshit@1234');
        logger.info('Manager Login: rahul@orion.com / Harshit@1234');
        logger.info('HR Login: priya@orion.com / Harshit@1234');
        logger.info('Employee Logins: amit@orion.com, sneha@orion.com, etc. / Harshit@1234');
        logger.info('----------------------\n');

        process.exit(0);
    } catch (error) {
        logger.error('Seeding error:', error);
        process.exit(1);
    }
};

seed();
