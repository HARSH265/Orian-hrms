import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, Tag, } from 'antd';
import { fetchTeamTasks, createTask } from '../../features/task/taskThunks';
import { fetchMyTeam } from '../../features/manager/managerThunks';

const { Option } = Select;

const TeamTasks = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    const { teamTasks, status } = useSelector((state) => state.task);
    const { myTeam } = useSelector((state) => state.manager);

    useEffect(() => {
        dispatch(fetchTeamTasks());
        dispatch(fetchMyTeam());
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
        { title: 'Assigned To', dataIndex: ['assignee', 'name'], key: 'assignee' },
        { title: 'Due Date', dataIndex: 'dueDate', render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A' },
        { title: 'Priority', dataIndex: 'priority', render: (priority) => <Tag>{priority}</Tag> },
        { title: 'Status', dataIndex: 'status', render: (status) => <Tag>{status}</Tag> },
    ];

    return (
        <>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Button type="primary" onClick={showModal}>Create Task</Button>
            </div>
            <Table columns={columns} dataSource={teamTasks} rowKey="_id" loading={status === 'loading'} pagination={{ pageSize: 10 }} />
            <Modal title="Create New Task" open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="title" label="Task Title" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={4} /></Form.Item>
                    <Form.Item name="assignee" label="Assign To" rules={[{ required: true }]}>
                        <Select placeholder="Select a team member">
                            {myTeam.map(member => (<Option key={member._id} value={member._id}>{member.name}</Option>))}
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

export default TeamTasks;