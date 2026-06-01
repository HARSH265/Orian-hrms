// In: client/src/config/permissions.js

// This object should mirror your backend `permissions.js` file.
// The KEYS are now the lowercase strings that the backend expects.
export const PERMISSIONS_CONFIG = {
    'view_all_users': { name: 'View All Users', group: 'User Management' },
    'manage_users': { name: 'Manage Users (Create, Edit, Deactivate)', group: 'User Management' },
    'view_sensitive_data': { name: 'View Sensitive Data', group: 'User Management' },
    'manage_roles_permissions': { name: 'Manage Roles & Permissions', group: 'Administration' },
    'view_user_checklists': { name: 'View User Checklists', group: 'User Management' },
    'assign_leave_policies': { name: 'Assign Leave Policies', group: 'User Management' },
    
    'edit_own_profile': { name: 'Edit Own Profile', group: 'Profile' },
    'view_own_assets': { name: 'View Own Assets', group: 'Profile' },
    'manage_own_skills': { name: 'Manage Own Skills', group: 'Profile' },
    'request_leave': { name: 'Request Leave', group: 'Profile' },

    'view_team_members': { name: 'View Team Members', group: 'Team Management' },
    'view_team_tasks': { name: 'View Team Tasks', group: 'Team Management' },
    'create_team_tasks': { name: 'Create Team Tasks', group: 'Team Management' },
    'view_team_leave': { name: 'View Team Leave', group: 'Team Management' },
    'approve_leave_requests': { name: 'Approve Leave Requests', group: 'Team Management' },
    'view_team_attendance': { name: 'View Team Attendance', group: 'Team Management' },

    'create_tasks': { name: 'Create Tasks', group: 'Task Management' },
    'edit_all_tasks': { name: 'Edit All Tasks (Admin)', group: 'Task Management' },
    'delete_all_tasks': { name: 'Delete All Tasks (Admin)', group: 'Task Management' },
    
    'manage_checklist_templates': { name: 'Manage Checklist Templates', group: 'Checklists' },
    'apply_checklists': { name: 'Apply Checklists', group: 'Checklists' },

    'manage_departments': { name: 'Manage Departments', group: 'HR Modules' },
    'manage_announcements': { name: 'Manage Announcements', group: 'HR Modules' },
    'manage_assets': { name: 'Manage Assets', group: 'HR Modules' },
    'manage_leave_policies': { name: 'Manage Leave Policies', group: 'HR Modules' },
    'manage_all_leave_requests': { name: 'Manage All Leave Requests', group: 'HR Modules' },
    
    'manage_jobs': { name: 'Manage Jobs', group: 'Recruiting' },
    'view_referrals': { name: 'View Referrals', group: 'Recruiting' },

    'manage_system_settings': { name: 'Manage System Settings', group: 'Administration' },
    'manage_custom_fields': { name: 'Manage Custom Fields', group: 'Administration' }
};

// This helper function now works with the corrected keys
export const getGroupedPermissions = () => {
    return Object.entries(PERMISSIONS_CONFIG).reduce((acc, [key, value]) => {
        const group = value.group || 'General';
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push({ key, name: value.name });
        return acc;
    }, {});
};