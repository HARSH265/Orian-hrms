import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Card, Typography, Tag, Button, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { fetchAllTasks, createTask } from '../features/task/taskThunks';
import { fetchAllUsers } from '../features/admin/adminThunks';
import TaskDetailsModal from '../components/tasks/TaskDetailsModal';

const { Title } = Typography;
const { Option } = Select;

const AdminTasksPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
     const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
      const [selectedTask, setSelectedTask] = useState(null); 
    const [form] = Form.useForm();
    
    const { allTasks, status } = useSelector((state) => state.task);
    const { users: assignableUsers } = useSelector((state) => state.admin); // Use the full user list for assignment

    useEffect(() => {
        dispatch(fetchAllTasks());
        dispatch(fetchAllUsers()); // Ensure we have the list of users to assign to
    }, [dispatch]);
    
    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };

    const onFinish = (values) => {
        dispatch(createTask(values)).unwrap()
            .then(() => {
                message.success('Task created successfully!');
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

     const showDetailsModal = (task) => {
        setSelectedTask(task);
        setIsDetailsModalOpen(true);
    };
    const handleDetailsCancel = () => {
        setIsDetailsModalOpen(false);
        setSelectedTask(null);
    };

    const columns = [
         { 
            title: 'Task', 
            dataIndex: 'title', 
            key: 'title', 
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => <a onClick={() => showDetailsModal(record)}>{text}</a>
        },
        { title: 'Creator', dataIndex: ['creator', 'name'], key: 'creator' },
        { title: 'Assignee', dataIndex: ['assignee', 'name'], key: 'assignee' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
        { title: 'Priority', dataIndex: 'priority', key: 'priority' },
        { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
    ];

    return (
        <>
            <Card title={<Title level={3}>Global Task Dashboard</Title>} extra={<Button type="primary" onClick={showModal}>Create Task</Button>}>
                <Table
                    columns={columns}
                    dataSource={allTasks}
                    rowKey="_id"
                    loading={status === 'loading'}
                    pagination={{ pageSize: 15 }}
                    scroll={{ x: true }}
                />
            </Card>

            <Modal title="Create New Task" open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item name="assignee" label="Assign To" rules={[{ required: true }]}>
                        <Select placeholder="Select a user to assign the task to">
                            {assignableUsers.map(user => (<Option key={user._id} value={user._id}>{user.name} ({user.role})</Option>))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="dueDate" label="Due Date"><DatePicker /></Form.Item>
                    <Form.Item name="priority" label="Priority" initialValue="Medium">
                        <Select><Option value="High">High</Option><Option value="Medium">Medium</Option><Option value="Low">Low</Option></Select>
                    </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Assign Task</Button></Form.Item>
                </Form>
            </Modal>

            <TaskDetailsModal
                open={isDetailsModalOpen}
                onCancel={handleDetailsCancel}
                task={selectedTask}
            />
        </>
    );
};

export default AdminTasksPage;