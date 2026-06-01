// In: client/src/pages/TaskRouterPage.js

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Spin } from 'antd';

import MyTasksPage from './MyTasksPage';
import HighLevelTasksPage from './HighLevelTasksPage.js';

// --- NEW IMPORTS ---
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';
import { closeTaskDetailsModal } from '../features/task/taskSlice';

const TaskRouterPage = () => {
    const dispatch = useDispatch();
    const { user, status } = useSelector((state) => state.auth);

    // --- NEW: Select the modal's state from Redux ---
    const { isDetailsModalOpen, viewingTaskId } = useSelector((state) => state.task);

    if (!user || status === 'loading') {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
    }

    const handleCloseModal = () => {
        dispatch(closeTaskDetailsModal());
    };

    const renderTaskView = () => {
        if (user.role === 'manager' || user.role === 'hr' || user.role === 'super-admin') {
            return <HighLevelTasksPage />;
        }
        return <MyTasksPage />;
    };

    return (
        <>
            {renderTaskView()}
            
            {/* --- NEW: The modal is now rendered globally and controlled by Redux --- */}
            <TaskDetailsModal
                open={isDetailsModalOpen}
                onCancel={handleCloseModal}
                taskId={viewingTaskId}
            />
        </>
    );
};

export default TaskRouterPage;