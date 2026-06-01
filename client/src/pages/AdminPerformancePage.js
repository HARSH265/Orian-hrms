// src/pages/AdminPerformancePage.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Card, Typography, Modal, Form, Input, message, Select } from 'antd';
import { fetchAllUsers } from '../features/admin/adminThunks';
import { initiateReviewCycle } from '../features/review/reviewThunks';

const { Title } = Typography;
const { Option } = Select;

const AdminPerformancePage = () => {
    const dispatch = useDispatch();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    const { users } = useSelector((state) => state.admin);
    const { status } = useSelector((state) => state.review);

    useEffect(() => {
        dispatch(fetchAllUsers());
    }, [dispatch]);

    const showModal = () => setIsModalVisible(true);
    const handleCancel = () => setIsModalVisible(false);

    const onFinish = (values) => {
        dispatch(initiateReviewCycle(values)).unwrap()
            .then((msg) => { message.success(msg); handleCancel(); })
            .catch((err) => message.error(err));
    };

    return (
        <>
            <Card title={<Title level={3}>Performance Review Cycles</Title>} extra={<Button type="primary" onClick={showModal}>Initiate New Cycle</Button>}>
                {/* We can add a list of past cycles here later */}
                <p>Create and launch new performance review cycles for employees.</p>
            </Card>
            <Modal title="Initiate New Review Cycle" open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item name="cycleName" label="Cycle Name" rules={[{ required: true }]}><Input placeholder="e.g., 2025 Annual Review" /></Form.Item>
                    <Form.Item name="employeeIds" label="Select Employees" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Select employees to include">
                            {users.filter(u => u.role === 'employee' || u.role === 'manager').map(u => (
                                <Option key={u._id} value={u._id}>{u.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item><Button type="primary" htmlType="submit" loading={status === 'loading'}>Launch Cycle</Button></Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default AdminPerformancePage;