// In: your component file (e.g., client/src/components/dashboard/MyOpenTasks.js)

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Tag, Spin, Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { fetchMyTasks } from '../../features/task/taskThunks';
import { openTaskDetailsModal } from '../../features/task/taskSlice';

const { Title, Text } = Typography;

const MyOpenTasks = () => {
    const dispatch = useDispatch();

    // Select the entire state object for myTasks first for safety.
    const myTasksState = useSelector((state) => state.task.myTasks);

    // --- BULLETPROOF GUARD: Ensure `myTasks` is ALWAYS an array ---
    // If myTasksState or myTasksState.data is undefined/null, default to an empty array.
    const myTasks = myTasksState?.data || [];
    const status = myTasksState?.status || 'idle';

    useEffect(() => {
        dispatch(fetchMyTasks({
            page: 1,
            limit: 5,
            sortBy: 'dueDate',
            order: 'asc',
            filters: { status: 'In Progress' }
        }));
    }, [dispatch]);
    
    const handleTaskClick = (taskId) => {
        dispatch(openTaskDetailsModal(taskId));
    };

    // --- CRITICAL: The .filter() line has been completely removed from this version ---
    // If you still get an error about .filter(), it means this is not the file running.

    return (
        <Card 
            title={<Title level={5}>My Open Tasks</Title>}
            extra={<Link to="/tasks">View All</Link>}
        >
            {status === 'loading' && myTasks.length === 0 ? <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div> : (
                <List
                    // Use the guarded `myTasks` variable which is guaranteed to be an array.
                    dataSource={myTasks}
                    renderItem={task => (
                        <List.Item>
                            <List.Item.Meta
                                title={<Link onClick={() => handleTaskClick(task._id)}>{task.title}</Link>}
                                description={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`}
                            />
                            <Tag>{task.status}</Tag>
                        </List.Item>
                    )}
                    locale={{ emptyText: 'No open tasks. Great job!' }}
                />
            )}
        </Card>
    );
};

export default MyOpenTasks;