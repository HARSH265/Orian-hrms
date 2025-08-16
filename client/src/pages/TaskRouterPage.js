import React from 'react';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';

import MyTasksPage from './MyTasksPage';
import HighLevelTasksPage from './HighLevelTasksPage.js'; // <-- The new hub page

const TaskRouterPage = () => {
    const { user, status } = useSelector((state) => state.auth);

    if (!user || status === 'loading') {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
    }

    // If the user is a manager OR HR OR super-admin, show the advanced, tabbed hub page.
    if (user.role === 'manager' || user.role === 'hr' || user.role === 'super-admin') {
        return <HighLevelTasksPage />;
    }

    // Otherwise, show the original, simple view for employees.
    return <MyTasksPage />;
};

export default TaskRouterPage;