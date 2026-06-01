import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Card, Typography, Modal, Form, Input, message, Space, InputNumber } from 'antd';
import { fetchLeavePolicies, createLeavePolicy } from '../features/leave-policy/leavePolicyThunks';

const { Title } = Typography;

const AdminLeavePoliciesPage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    const { policies, status } = useSelector((state) => state.leavePolicy);

    useEffect(() => {
        dispatch(fetchLeavePolicies());
    }, [dispatch]);

    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };

    const onFinish = (values) => {
        dispatch(createLeavePolicy(values)).unwrap()
            .then(() => {
                message.success('Leave Policy created successfully!');
                handleCancel();
            })
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Policy Name', dataIndex: 'name', key: 'name' },
        { title: 'Days Per Year', dataIndex: 'daysPerYear', key: 'daysPerYear' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
    ];

    return (
        <>
            <Card title={<Title level={3}>Leave Policy Management</Title>} extra={<Button type="primary" onClick={showModal}>Create New Policy</Button>}>
                <Table columns={columns} dataSource={policies} rowKey="_id" loading={status === 'loading'} />
            </Card>

            <Modal title="Create New Leave Policy" open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="name" label="Policy Name" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
                    <Form.Item name="daysPerYear" label="Days Per Year" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Create Policy</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AdminLeavePoliciesPage;