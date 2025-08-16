import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Tag, Button, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import { fetchAllTasks, createTask } from '../../features/task/taskThunks';
import { fetchAllUsers } from '../../features/admin/adminThunks';

const { Option } = Select;

const AllSystemTasks = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    const { allTasks, status } = useSelector((state) => state.task);
    const { users: assignableUsers } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchAllTasks());
        dispatch(fetchAllUsers());
    }, [dispatch]);
    
    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };

    const onFinish = (values) => {
        dispatch(createTask(values)).unwrap()
            .then(() => { message.success('Task created successfully!'); handleCancel(); })
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Task', dataIndex: 'title', key: 'title' },
        { title: 'Creator', dataIndex: ['creator', 'name'], key: 'creator' },
        { title: 'Assignee', dataIndex: ['assignee', 'name'], key: 'assignee' },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag>{status}</Tag> },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" onClick={showModal}>Create Task</Button>
            </div>
            <Table columns={columns} dataSource={allTasks} rowKey="_id" loading={status === 'loading'} pagination={{ pageSize: 15 }} scroll={{ x: true }} />
            <Modal title="Create New Task" open={isModalVisible} onCancel={handleCancel} footer={null}>
                 <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item name="assignee" label="Assign To" rules={[{ required: true }]}>
                        <Select placeholder="Select a user">
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
        </>
    );
};

export default AllSystemTasks;