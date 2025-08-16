import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List,  Tag, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { fetchMyTasks } from '../../features/task/taskThunks';

// const { Text } = Typography;

const MyOpenTasks = () => {
    const dispatch = useDispatch();
    const { myTasks, status } = useSelector((state) => state.task);

    useEffect(() => {
        dispatch(fetchMyTasks());
    }, [dispatch]);

    // Filter for tasks that are not 'Done' and take the first 5
    const openTasks = myTasks.filter(task => task.status !== 'Done').slice(0, 5);

    if (status === 'loading') return <Spin />;

    return (
        <List
            header={<div>My Open Tasks</div>}
            bordered
            dataSource={openTasks}
            renderItem={task => (
                <List.Item>
                    <List.Item.Meta
                        title={<Link to="/tasks">{task.title}</Link>}
                        description={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}`}
                    />
                    <Tag>{task.status}</Tag>
                </List.Item>
            )}
            locale={{ emptyText: 'No open tasks. Great job!' }}
        />
    );
};

export default MyOpenTasks;