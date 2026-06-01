// In: client/src/hooks/usePermissions.js

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { PERMISSIONS_CONFIG as allPermissions } from '../config/permissions'; // Assuming your frontend config is named this

export const usePermissions = () => {
    const { user } = useSelector((state) => state.auth);

    // useMemo will recalculate the permissions only when the user object changes
    const permissions = useMemo(() => {
        const userPermissions = new Set();

        if (!user) {
            return userPermissions;
        }

        // A super-admin always has all permissions
        if (user.systemRole === 'super-admin') {
            Object.values(allPermissions).forEach(p => userPermissions.add(p));
            return userPermissions;
        }

        // Add permissions from the user's assigned functional roles
        if (user.roles && Array.isArray(user.roles)) {
            user.roles.forEach(role => {
                if (role.permissions && Array.isArray(role.permissions)) {
                    role.permissions.forEach(permission => {
                        userPermissions.add(permission);
                    });
                }
            });
        }

        return userPermissions;
    }, [user]);
    
    // The hook returns a simple function to check for a permission
    const hasPermission = (requiredPermission) => {
        return permissions.has(requiredPermission);
    };

    // We can also return the raw Set if needed elsewhere
    return { hasPermission, permissionsSet: permissions };
};