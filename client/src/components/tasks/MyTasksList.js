import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Spin, Tag, Select, message, Typography } from 'antd';
import { fetchMyTasks, updateTaskStatus } from '../../features/task/taskThunks';

const { Text } = Typography;
const { Option } = Select;

const MyTasksList = () => {
    const dispatch = useDispatch();
    const { myTasks, status } = useSelector((state) => state.task);

    useEffect(() => {
        dispatch(fetchMyTasks());
    }, [dispatch]);

    const handleStatusChange = (taskId, newStatus) => {
        dispatch(updateTaskStatus({ taskId, status: newStatus }))
            .unwrap()
            .then(() => message.success('Task status updated!'))
            .catch((err) => message.error(err));
    };

    if (status === 'loading' && myTasks.length === 0) return <Spin />;

    return (
        <List
            dataSource={myTasks}
            locale={{ emptyText: 'You have no tasks assigned to you. Great job!' }}
            renderItem={task => (
                <List.Item
                    actions={[
                        <Select defaultValue={task.status} style={{ width: 120 }} onChange={(value) => handleStatusChange(task._id, value)}>
                            <Option value="To Do">To Do</Option>
                            <Option value="In Progress">In Progress</Option>
                            <Option value="Done">Done</Option>
                        </Select>
                    ]}
                >
                    <List.Item.Meta title={<Text strong>{task.title}</Text>} description={task.description} />
                    <div>
                        <Text type="secondary">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Text><br />
                        <Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}>{task.priority}</Tag>
                    </div>
                </List.Item>
            )}
        />
    );
};

export default MyTasksList;