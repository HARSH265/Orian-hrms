import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    List,
    Card,
    Typography,
    Spin,
    Tag,
    Select,
    message,
    Button,
    Modal,
    Form,
    Input,
    DatePicker,
    Row,
    Col
} from 'antd';
import {
    fetchMyTasks,
    updateTaskStatus,
    createTask,
    fetchTasksCreatedByMe
} from '../features/task/taskThunks';

const { Title, Text } = Typography;
const { Option } = Select;

// This page is the comprehensive task view specifically for non-managerial EMPLOYEES.
const MyTasksPage = () => {
    // --- Hooks and State Initialization ---
    const dispatch = useDispatch();
    const { myTasks, createdTasks, status } = useSelector((state) => state.task);
    const { user: loggedInUser } = useSelector((state) => state.auth);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- Effects ---
    useEffect(() => {
        // Fetch both sets of data when the page loads
        dispatch(fetchMyTasks());
        dispatch(fetchTasksCreatedByMe());
    }, [dispatch]);

    // --- Action Handlers ---
    const handleStatusChange = (taskId, newStatus) => {
        dispatch(updateTaskStatus({ taskId, status: newStatus }))
            .unwrap()
            .then(() => message.success('Task status updated!'))
            .catch((err) => message.error(err));
    };

    const showCreateModal = () => setIsModalVisible(true);
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    const onFinish = (values) => {
        const taskData = { ...values, assignee: loggedInUser?.manager?._id };
        dispatch(createTask(taskData))
            .unwrap()
            .then(() => {
                message.success(`Task assigned to ${loggedInUser.manager.name} successfully!`);
                handleCancel();
                // Refresh the list of created tasks after creating a new one
                dispatch(fetchTasksCreatedByMe());
            })
            .catch((err) => message.error(err));
    };

    return (
        <Row gutter={[24, 24]}>
            {/* Column for Tasks Assigned to Me */}
            <Col xs={24} lg={12}>
                <Card
                    title={<Title level={4}>Tasks Assigned to Me</Title>}
                    extra={
                        loggedInUser?.manager && (
                            <Button type="primary" onClick={showCreateModal}>
                                Create Task for Manager
                            </Button>
                        )
                    }
                >
                    {(status === 'loading' && myTasks.length === 0) ? <Spin /> : (
                        <List
                            dataSource={myTasks}
                            locale={{ emptyText: 'You have no tasks assigned to you. Great job!' }}
                            renderItem={task => (
                                <List.Item
                                    actions={[
                                        <Select
                                            defaultValue={task.status}
                                            style={{ width: 120 }}
                                            onChange={(value) => handleStatusChange(task._id, value)}
                                        >
                                            <Option value="To Do">To Do</Option>
                                            <Option value="In Progress">In Progress</Option>
                                            <Option value="Done">Done</Option>
                                        </Select>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={<Text strong>{task.title}</Text>}
                                        description={task.description}
                                    />
                                    <div>
                                        <Text type="secondary">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</Text>
                                        <br />
                                        <Tag color={task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'blue'}>
                                            {task.priority}
                                        </Tag>
                                    </div>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </Col>

            {/* Column for Tasks I've Created */}
            <Col xs={24} lg={12}>
                <Card title={<Title level={4}>Tasks I've Created</Title>}>
                    {(status === 'loading' && createdTasks.length === 0) ? <Spin /> : (
                        <List
                            dataSource={createdTasks}
                            locale={{ emptyText: "You have not created any tasks for others." }}
                            renderItem={task => (
                                <List.Item>
                                    <List.Item.Meta
                                        title={<Text strong>{task.title}</Text>}
                                        description={`Assigned to: ${task.assignee?.name || 'N/A'}`}
                                    />
                                    <Tag>{task.status}</Tag>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </Col>

            {/* Modal for creating a new task */}
            <Modal
                title="Create a New Task for Your Manager"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                {loggedInUser?.manager ? (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item label="Assign To">
                            <Input value={loggedInUser.manager.name} disabled />
                        </Form.Item>
                        <Form.Item name="title" label="Task Title" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item name="dueDate" label="Due Date">
                            <DatePicker />
                        </Form.Item>
                        <Form.Item name="priority" label="Priority" initialValue="Medium">
                            <Select>
                                <Option value="High">High</Option>
                                <Option value="Medium">Medium</Option>
                                <Option value="Low">Low</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={status === 'loading'}>
                                Assign Task
                            </Button>
                        </Form.Item>
                    </Form>
                ) : (
                    <Text type="warning">You cannot create a task because you do not have a manager assigned.</Text>
                )}
            </Modal>
        </Row>
    );
};

export default MyTasksPage;