// Seed script for Orion project
// Run with: node scripts/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const mongoose = require('mongoose');

const Role = require('../model/role.model');
const Department = require('../model/department.model');
const User = require('../model/user');

async function seed() {
  await connectDB();
  // Clear existing data (optional)
  await Promise.all([
    Role.deleteMany({}),
    Department.deleteMany({}),
    User.deleteMany({})
  ]);

  // Create system roles with appropriate permissions
  const { PERMISSIONS } = require('../config/permissions');
  const allPermissions = Object.values(PERMISSIONS);

  const superAdminRole = await Role.create({
    name: 'super-admin',
    description: 'Super admin role with all permissions',
    permissions: allPermissions,
    isSystemRole: true,
  });

  const hrRole = await Role.create({
    name: 'hr',
    description: 'HR role',
    permissions: [
      PERMISSIONS.VIEW_ALL_USERS,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.VIEW_SENSITIVE_DATA,
      PERMISSIONS.MANAGE_SENSITIVE_DATA,
      PERMISSIONS.MANAGE_DEPARTMENTS,
      PERMISSIONS.MANAGE_LEAVE_POLICIES,
      PERMISSIONS.MANAGE_ALL_LEAVE_REQUESTS,
      PERMISSIONS.MANAGE_ANNOUNCEMENTS,
      PERMISSIONS.MANAGE_ASSETS,
      PERMISSIONS.MANAGE_ROLES_PERMISSIONS,
    ],
    isSystemRole: true,
  });

  const managerRole = await Role.create({
    name: 'manager',
    description: 'Manager role',
    permissions: [
      PERMISSIONS.VIEW_TEAM_MEMBERS,
      PERMISSIONS.VIEW_TEAM_TASKS,
      PERMISSIONS.CREATE_TEAM_TASKS,
      PERMISSIONS.VIEW_TEAM_LEAVE,
      PERMISSIONS.APPROVE_LEAVE_REQUESTS,
    ],
    isSystemRole: true,
  });

  const employeeRole = await Role.create({
    name: 'employee',
    description: 'Employee role',
    permissions: [
      PERMISSIONS.EDIT_OWN_PROFILE,
      PERMISSIONS.VIEW_OWN_ASSETS,
      PERMISSIONS.MANAGE_OWN_SKILLS,
      PERMISSIONS.REQUEST_LEAVE,
    ],
    isSystemRole: true,
  });

  // Create departments
  const engineering = await Department.create({ name: 'Engineering', description: 'Engineering team' });
  const hrDept = await Department.create({ name: 'Human Resources', description: 'HR team' });

  // Helper to create a user
  async function createUser({ name, email, password, systemRole, roleIds, departmentId, managerId }) {
    const user = new User({
      name,
      email,
      password, // pre-save hook will hash it
      systemRole,
      roles: roleIds,
      department: departmentId,
      manager: managerId,
      isActive: true,
    });
    await user.save();
    return user;
  }

  // Seed users
  const superAdmin = await createUser({
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'Password123!',
    systemRole: 'super-admin',
    roleIds: [superAdminRole._id],
    departmentId: engineering._id,
  });

  const hrUser = await createUser({
    name: 'HR User',
    email: 'hr@example.com',
    password: 'Password123!',
    systemRole: 'hr',
    roleIds: [hrRole._id],
    departmentId: hrDept._id,
  });

  const managerUser = await createUser({
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'Password123!',
    systemRole: 'manager',
    roleIds: [managerRole._id],
    departmentId: engineering._id,
    managerId: superAdmin._id,
  });

  const employeeUser = await createUser({
    name: 'Employee User',
    email: 'employee@example.com',
    password: 'Password123!',
    systemRole: 'employee',
    roleIds: [employeeRole._id],
    departmentId: engineering._id,
    managerId: managerUser._id,
  });

  console.log('✅ Dummy data seeded successfully');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
