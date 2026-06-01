// In: server/config/permissions.js

const PERMISSIONS = {
    // ======== USER & ROLE MANAGEMENT (ADMIN) ========
    VIEW_ALL_USERS: 'view_all_users',
    MANAGE_USERS: 'manage_users', // Create, Edit, Deactivate
    VIEW_SENSITIVE_DATA: 'view_sensitive_data',
    MANAGE_SENSITIVE_DATA: 'manage_sensitive_data',
    MANAGE_ROLES_PERMISSIONS: 'manage_roles_permissions',
    VIEW_USER_CHECKLISTS: 'view_user_checklists',
    ASSIGN_LEAVE_POLICIES: 'assign_leave_policies',

    // ======== PROFILE MANAGEMENT (SELF-SERVICE) ========
    EDIT_OWN_PROFILE: 'edit_own_profile',
    VIEW_OWN_ASSETS: 'view_own_assets',
    MANAGE_OWN_SKILLS: 'manage_own_skills',
    REQUEST_LEAVE: 'request_leave',

    // ======== TEAM MANAGEMENT (MANAGER) ========
    VIEW_TEAM_MEMBERS: 'view_team_members',
    VIEW_TEAM_TASKS: 'view_team_tasks',
    CREATE_TEAM_TASKS: 'create_team_tasks',
    VIEW_TEAM_LEAVE: 'view_team_leave',
    APPROVE_LEAVE_REQUESTS: 'approve_leave_requests',
    VIEW_TEAM_ATTENDANCE: 'view_team_attendance',

    // ======== TASK MANAGEMENT ========
    CREATE_TASKS: 'create_tasks',
    EDIT_ALL_TASKS: 'edit_all_tasks', // For HR/Admin to edit any task
    DELETE_ALL_TASKS: 'delete_all_tasks', // For HR/Admin to delete any task

    // ======== CHECKLIST MANAGEMENT (ADMIN) ========
    MANAGE_CHECKLIST_TEMPLATES: 'manage_checklist_templates',
    APPLY_CHECKLISTS: 'apply_checklists',

    // ======== HR MODULES (ADMIN) ========
    MANAGE_DEPARTMENTS: 'manage_departments',
    MANAGE_ANNOUNCEMENTS: 'manage_announcements',
    MANAGE_ASSETS: 'manage_assets',
    MANAGE_LEAVE_POLICIES: 'manage_leave_policies',
    MANAGE_ALL_LEAVE_REQUESTS: 'manage_all_leave_requests', // View all leave, not just team
    
    // ======== RECRUITING (ADMIN) ========
    MANAGE_JOBS: 'manage_jobs',
    VIEW_REFERRALS: 'view_referrals',

    // ======== SETTINGS (SUPER-ADMIN) ========
    MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
    MANAGE_CUSTOM_FIELDS: 'manage_custom_fields'
};

// We will no longer use a hardcoded map. Instead, we will seed the database
// with default roles that have these permissions. But we keep this object
// as a reference for the super-admin's absolute power.
const SUPER_ADMIN_PERMISSIONS = Object.values(PERMISSIONS);

module.exports = {
    SYSTEM_ROLE_PERMISSIONS: {
        employee: [],
        manager: [
            PERMISSIONS.VIEW_TEAM_MEMBERS,
            PERMISSIONS.VIEW_TEAM_TASKS,
            PERMISSIONS.CREATE_TEAM_TASKS,
            PERMISSIONS.VIEW_TEAM_LEAVE,
            PERMISSIONS.APPROVE_LEAVE_REQUESTS,
            PERMISSIONS.VIEW_TEAM_ATTENDANCE,
            PERMISSIONS.CREATE_TASKS,
        ],
        hr: [
            PERMISSIONS.MANAGE_USERS,
            PERMISSIONS.VIEW_ALL_USERS,
            PERMISSIONS.MANAGE_ROLES_PERMISSIONS,
            PERMISSIONS.MANAGE_DEPARTMENTS,
            PERMISSIONS.MANAGE_ANNOUNCEMENTS,
            PERMISSIONS.MANAGE_ASSETS,
            PERMISSIONS.MANAGE_LEAVE_POLICIES,
            PERMISSIONS.MANAGE_ALL_LEAVE_REQUESTS,
            PERMISSIONS.MANAGE_JOBS,
            PERMISSIONS.VIEW_REFERRALS,
            PERMISSIONS.CREATE_TASKS,
            PERMISSIONS.EDIT_ALL_TASKS,
            PERMISSIONS.DELETE_ALL_TASKS,
        ],
        "super-admin": SUPER_ADMIN_PERMISSIONS,
    },
    PERMISSIONS,
    SUPER_ADMIN_PERMISSIONS,
};
    PERMISSIONS,
    SUPER_ADMIN_PERMISSIONS,
};