// In: client/src/pages/MyTasksPage.js

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List, Card, Typography, Spin, Tag, Select, message, Button, Modal, Form, Input, DatePicker, Row, Col, Avatar, Tooltip } from 'antd';
import { createTask, fetchTasksCreatedByMe } from '../features/task/taskThunks';
import MyTasksList from '../components/tasks/MyTasksList'; // This is the component for "Tasks Assigned to Me"
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';

const { Title, Text } = Typography;
const { Option } = Select;

const MyTasksPage = () => {
    const dispatch = useDispatch();
    
    // --- Redux State ---
    // We now get a separate pagination object for the "Created Tasks" list
    const { createdTasks, status, pagination: createdTasksPagination } = useSelector((state) => state.task);
    const { user: loggedInUser } = useSelector((state) => state.auth);
    
    // --- Component State ---
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [form] = Form.useForm();

    // --- NEW: State to control the "Created Tasks" list API ---
    const [createdTasksPage, setCreatedTasksPage] = useState(1);

    // --- Effects ---
    // This effect now fetches the "Created Tasks" list whenever the page changes.
    useEffect(() => {
        dispatch(fetchTasksCreatedByMe({
            page: createdTasksPage,
            limit: 5, // Show 5 per page in this list
            sortBy: 'createdAt',
            order: 'desc',
            filters: {} // No filters on this view for now, but the capability is there
        }));
    }, [dispatch, createdTasksPage]);
    
    // --- Handlers ---
    const showCreateModal = () => setIsCreateModalVisible(true);
    const handleCancel = () => { setIsCreateModalVisible(false); form.resetFields(); };
    
    const onFinish = (values) => {
        // --- UPGRADE: Assignees is now an array ---
        const taskData = { ...values, assignees: [loggedInUser?.manager?._id] };
        dispatch(createTask(taskData)).unwrap()
            .then(() => {
                message.success(`Task assigned to ${loggedInUser.manager.name} successfully!`);
                handleCancel();
                // Refresh the list to show the new task
                if (createdTasksPage === 1) {
                    dispatch(fetchTasksCreatedByMe({ page: 1, limit: 5, sortBy: 'createdAt', order: 'desc', filters: {} }));
                } else {
                    setCreatedTasksPage(1);
                }
            })
            .catch((err) => message.error(err));
    };

    const showDetailsModal = (taskId) => {
        setSelectedTaskId(taskId);
        setIsDetailsModalOpen(true);
    };
    const handleDetailsCancel = () => {
        setIsDetailsModalOpen(false);
        setSelectedTaskId(null);
    };

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card
                    title={<Title level={4}>Tasks Assigned to Me</Title>}
                    extra={ loggedInUser?.manager && (<Button type="primary" onClick={showCreateModal}>Create Task for Manager</Button>)}
                >
                    {/* This component is already paginated and filterable from our previous steps */}
                    <MyTasksList />
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card title={<Title level={4}>Tasks I've Created</Title>}>
                    {/* --- UPGRADE: Use a List with pagination controls --- */}
                    <List
                        dataSource={createdTasks}
                        loading={status === 'loading'}
                        locale={{ emptyText: "You have not created any tasks for others." }}
                        // --- NEW: Pagination configuration ---
                        pagination={{
                            current: createdTasksPage,
                            pageSize: 5,
                            total: createdTasksPagination.total,
                            onChange: (page) => setCreatedTasksPage(page),
                        }}
                        renderItem={task => (
                            <List.Item>
                                <List.Item.Meta
                                    title={<a onClick={() => showDetailsModal(task._id)}><Text strong>{task.title}</Text></a>}
                                    description={
                                        <Avatar.Group maxCount={3}>
                                            {task.assignees.map(user => (
                                                <Tooltip title={user.name} key={user._id}>
                                                    <Avatar size="small" src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar>
                                                </Tooltip>
                                            ))}
                                        </Avatar.Group>
                                    }
                                />
                                <Tag>{task.status}</Tag>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>

            {/* Create Task Modal */}
            <Modal title="Create a New Task for Your Manager" open={isCreateModalVisible} onCancel={handleCancel} footer={null}>
                {loggedInUser?.manager ? (
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item label="Assign To"><Input value={loggedInUser.manager.name} disabled /></Form.Item>
                        <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                        <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                        <Form.Item name="dueDate" label="Due Date"><DatePicker /></Form.Item>
                        <Form.Item name="priority" label="Priority" initialValue="Medium">
                            <Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select>
                        </Form.Item>
                        <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
                    </Form>
                ) : (<Text type="warning">You cannot create a task because you do not have a manager assigned.</Text>)}
            </Modal>

            <TaskDetailsModal
                open={isDetailsModalOpen}
                onCancel={handleDetailsCancel}
                taskId={selectedTaskId}
            />
        </Row>
    );
};

export default MyTasksPage;