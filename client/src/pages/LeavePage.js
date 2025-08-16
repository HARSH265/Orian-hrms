import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, DatePicker, Table, Tag, message, Typography, Row, Col, Popconfirm, Switch, Space } from 'antd';
import { fetchMyLeaveHistory, applyForLeave, withdrawLeave } from '../features/leave/leaveThunks';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const LeavePage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [hideCompleted, setHideCompleted] = useState(false); // Default to showing all

    const { leaves, status } = useSelector((state) => state.leave);

    useEffect(() => {
        dispatch(fetchMyLeaveHistory());
    }, [dispatch]);

    const filteredLeaves = hideCompleted
        ? leaves.filter(leave => leave.status === 'Pending' || leave.status === 'Approved')
        : leaves;

    const onFinish = (values) => {
        const leaveData = {
            startDate: values.dateRange[0].toISOString(),
            endDate: values.dateRange[1].toISOString(),
            reason: values.reason,
        };
        dispatch(applyForLeave(leaveData))
            .unwrap()
            .then(() => {
                message.success('Leave request submitted successfully!');
                form.resetFields();
            })
            .catch((err) => message.error(`Failed to submit: ${err}`));
    };

    const handleWithdraw = (leaveId) => {
        dispatch(withdrawLeave(leaveId))
            .unwrap()
            .then(() => message.success('Leave request withdrawn.'))
            .catch((err) => message.error(err));
    };

    const columns = [
        { title: 'Start Date', dataIndex: 'startDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'End Date', dataIndex: 'endDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Reason', dataIndex: 'reason' },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status) => {
                let color;
                switch (status) {
                    case 'Approved': color = 'success'; break;
                    case 'Pending': color = 'warning'; break;
                    case 'Denied': color = 'error'; break;
                    case 'Withdrawn': color = 'default'; break;
                    default: color = 'processing';
                }
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            },
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                record.status === 'Pending' && (
                    <Popconfirm
                        title="Are you sure you want to withdraw this request?"
                        onConfirm={() => handleWithdraw(record._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger size="small">Withdraw</Button>
                    </Popconfirm>
                )
            ),
        },
    ];

    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
                <Card title={<Title level={4}>Apply for Leave</Title>}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item name="dateRange" label="Select Dates" rules={[{ required: true }]}>
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                            <Input.TextArea rows={4} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={status === 'loading'}>Submit Request</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={16}>
                <Card
                    title={<Title level={4}>My Leave History</Title>}
                    extra={
                        <Space align="center">
                            <Text>{hideCompleted ? 'Showing Active Only' : 'Showing All'}</Text>
                            <Switch checked={hideCompleted} onChange={setHideCompleted} />
                        </Space>
                    }
                >
                    <Table
                        columns={columns}
                        dataSource={filteredLeaves}
                        rowKey="_id"
                        loading={status === 'loading'}
                        pagination={{ pageSize: 10, responsive: true }}
                        scroll={{ x: true }}
                    />
                </Card>
            </Col>
        </Row>
    );
};

export default LeavePage;