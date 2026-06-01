import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Input, Spin, Alert, Typography, List, Tag, Divider, Empty } from 'antd';
import { PaperClipOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Link } = Typography;

const TeamLeaveModal = ({ isOpen, onCancel, leaveRequestId, onUpdate }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [leaveData, setLeaveData] = useState(null);

    useEffect(() => {
        if (isOpen && leaveRequestId) {
            setLoading(true);
            setError(null);
            api.get(`/manager/leave-request/${leaveRequestId}`)
                .then(response => {
                    setLeaveData(response.data.data);
                    form.setFieldsValue({ managerNotes: response.data.data.request.managerNotes || '' });
                })
                .catch(() => setError('Could not load leave details.'))
                .finally(() => setLoading(false));
        } else {
            setLeaveData(null);
            form.resetFields();
        }
    }, [isOpen, leaveRequestId, form]);

    const handleApprove = () => {
        const notes = form.getFieldValue('managerNotes');
        onUpdate(leaveRequestId, 'Approved', notes);
    };

    const handleDeny = () => {
        form.validateFields()
            .then(values => {
                onUpdate(leaveRequestId, 'Denied', values.managerNotes);
            })
            .catch(() => {});
    };

    const request = leaveData?.request;
    const overlapping = leaveData?.overlapping;

    return (
        <Modal
            title={`Review Leave for ${request?.employee?.name || '...'}`}
            open={isOpen}
            onCancel={onCancel}
            footer={null}
            width={700}
            destroyOnClose
        >
            {loading && <Spin />}
            {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

            {request && (
                <div>
                    <Title level={5} style={{ marginTop: 0 }}>Leave Details</Title>
                    <p><Text strong>Reason: </Text>{request.reason}</p>
                    
                    {request.attachments && request.attachments.length > 0 && (
                        <div>
                            <Text strong>Attachments:</Text>
                            <List
                                dataSource={request.attachments}
                                renderItem={item => (
                                    <List.Item>
                                        <List.Item.Meta
                                            avatar={<PaperClipOutlined />}
                                            title={<Link href={item.filePath} target="_blank" rel="noopener noreferrer">{item.fileName}</Link>}
                                        />
                                    </List.Item>
                                )}
                            />
                        </div>
                    )}
                    <Divider />
                    <Title level={5}><TeamOutlined /> Overlapping Approved Leaves</Title>
                    {overlapping && overlapping.length > 0 ? (
                        <List
                            dataSource={overlapping}
                            renderItem={item => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<UserOutlined />}
                                        title={item.employee.name}
                                        description={`Department: ${item.employee.department?.name || 'N/A'}`}
                                    />
                                    <Tag color="blue">{`${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`}</Tag>
                                </List.Item>
                            )}
                        />
                    ) : ( <Empty description="No other employees have approved leave during this period." /> )}
                    <Divider />
                    <Form form={form} layout="vertical">
                        <Form.Item 
                            name="managerNotes" 
                            label="Notes (Required if denying)"
                            rules={[{ required: true, message: 'A reason is required to deny.' }]}
                        >
                            <Input.TextArea rows={3} />
                        </Form.Item>
                    </Form>
                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                        <Button onClick={onCancel} style={{ marginRight: 8 }}>Cancel</Button>
                        <Button onClick={handleDeny} danger style={{ marginRight: 8 }}>Deny</Button>
                        <Button onClick={handleApprove} type="primary">Approve</Button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default TeamLeaveModal;