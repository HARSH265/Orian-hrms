import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Form, Input, Button, DatePicker, Table, message, Typography, Row, Col, Popconfirm, Switch, Space, List, Divider, Select, Spin } from 'antd';
import StatusTag from '../components/common/StatusTag';
import { fetchMyLeaveHistory, applyForLeave, withdrawLeave } from '../features/leave/leaveThunks';
import { fetchMyLeaveBalances, fetchLeavePolicies } from '../features/leave-policy/leavePolicyThunks';
import LeaveDetailsModal from '../components/LeaveDetailsModal';
import FileUpload from '../components/FileUpload'; // Verify this path is correct

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const LeavePage = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [hideCompleted, setHideCompleted] = useState(false);
    const [isAttachmentRequired, setIsAttachmentRequired] = useState(false);

    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);

    const { policies, myBalances, status: balanceStatus } = useSelector((state) => state.leavePolicy);
    const { leaves, status: leaveStatus } = useSelector((state) => state.leave);

    useEffect(() => {
        dispatch(fetchMyLeaveHistory());
        dispatch(fetchMyLeaveBalances());
        dispatch(fetchLeavePolicies());
    }, [dispatch]);

    const filteredLeaves = hideCompleted
        ? leaves.filter(leave => leave.status === 'Pending' || leave.status === 'Approved')
        : leaves;

    const onFinish = (values) => {
        const leaveData = {
            startDate: values.dateRange[0].toISOString(),
            endDate: values.dateRange[1].toISOString(),
            reason: values.reason,
            leavePolicyId: values.leavePolicyId,
            attachments: values.attachments || [],
        };
        
        dispatch(applyForLeave(leaveData)).unwrap()
            .then(() => {
                message.success('Leave request submitted!');
                form.resetFields();
                setIsAttachmentRequired(false);
                dispatch(fetchMyLeaveBalances());
            })
            .catch((err) => message.error(`Failed to submit: ${err}`));
    };

    const handleWithdraw = (leaveId) => {
        dispatch(withdrawLeave(leaveId)).unwrap()
            .then(() => message.success('Leave request withdrawn.'))
            .catch((err) => message.error(err));
    };
    
    const handleFormValuesChange = (changedValues) => {
        if (changedValues.leavePolicyId) {
            const selectedPolicy = policies.find(p => p._id === changedValues.leavePolicyId);
            const requiresAttachment = selectedPolicy?.requiresAttachment || false;
            setIsAttachmentRequired(requiresAttachment);
            if (!requiresAttachment) {
                // If user switches away from a policy that required an attachment, clear the value
                form.setFieldsValue({ attachments: [] });
            }
        }
    };

    const handleUploadSuccess = (filePath) => {
        const fileName = filePath.split('/').pop();
        const attachmentData = [{ fileName: fileName, filePath: filePath }];
        form.setFieldsValue({ attachments: attachmentData });
        form.validateFields(['attachments']);
    };

    const handleFileRemove = () => {
        // Clear the data from the hidden form field
        form.setFieldsValue({ attachments: [] });
        // Re-validate to show the error message if an attachment is still required
        form.validateFields(['attachments']);
    };


    const showDetailsModal = (leave) => {
        setSelectedLeave(leave);
        setIsDetailsVisible(true);
    };

    const handleDetailsCancel = () => {
        setIsDetailsVisible(false);
        setSelectedLeave(null);
    };
    
    const columns = [
        { title: 'Start Date', dataIndex: 'startDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'End Date', dataIndex: 'endDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'Reason', dataIndex: 'reason' },
        {
            title: 'Status', dataIndex: 'status', render: (status) => <StatusTag status={status} />,
        },
       {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" onClick={() => showDetailsModal(record)}>
                        View Details
                    </Button>
                    {record.status === 'Pending' && (
                        <Popconfirm
                            title="Are you sure you want to withdraw this request?"
                            onConfirm={() => handleWithdraw(record._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="link" danger size="small">Withdraw</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        }
    ];
 
    return (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
                <Card title={<Title level={4}>Apply for Leave</Title>}>
                    <Title level={5}>My Leave Balances ({new Date().getFullYear()})</Title>
                    {balanceStatus === 'loading' && <Spin />}
                    <List
                        dataSource={myBalances}
                        renderItem={balance => (
                            <List.Item>
                                <List.Item.Meta title={balance.leavePolicy.name} />
                                <Text strong>{`${balance.totalDays - balance.daysTaken} / ${balance.totalDays}`}</Text>
                            </List.Item>
                        )}
                        locale={{ emptyText: "No leave policies have been assigned to you."}}
                    />
                    <Divider />
                    <Form form={form} layout="vertical" onFinish={onFinish} onValuesChange={handleFormValuesChange}>
                        <Form.Item name="leavePolicyId" label="Leave Type" rules={[{ required: true }]}>
                            <Select 
                                placeholder="Select leave type" 
                                options={myBalances.map(b => ({ value: b.leavePolicy._id, label: b.leavePolicy.name }))}
                                disabled={myBalances.length === 0}
                            />
                        </Form.Item>
                        <Form.Item name="dateRange" label="Select Dates" rules={[{ required: true }]}>
                            <RangePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        {isAttachmentRequired && (
                            <Form.Item label="Attachment (Required)">
                                <FileUpload 
                                    onUploadSuccess={handleUploadSuccess}
                                    onRemove={handleFileRemove} 
                                />
                            </Form.Item>
                        )}
                        
                        {/* Hidden field for validation and data submission */}
                        <Form.Item 
                            name="attachments" 
                            rules={[{ 
                                required: isAttachmentRequired, 
                                message: 'Please upload a document for this leave type.' 
                            }]}
                            style={{ display: 'none' }}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={leaveStatus === 'loading'}>Submit Request</Button>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
            <Col xs={24} lg={16}>
                <Card title={<Title level={4}>My Leave History</Title>} extra={<Space><Text>Hide Completed</Text><Switch checked={hideCompleted} onChange={setHideCompleted} /></Space>}>
                    <Table columns={columns} dataSource={filteredLeaves} rowKey="_id" loading={leaveStatus === 'loading'} scroll={{ x: true }} />
                </Card>
            </Col>

            <LeaveDetailsModal
                isOpen={isDetailsVisible}
                onCancel={handleDetailsCancel}
                leaveDetails={selectedLeave}
            />
        </Row>
    );
};

export default LeavePage;