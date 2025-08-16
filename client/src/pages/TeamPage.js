import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Tag, message, Typography, Card, Switch } from 'antd';
import { fetchTeamLeaveRequests, updateTeamLeaveRequest } from '../features/manager/managerThunks';

const { Title, Text } = Typography;

const TeamPage = () => {
    const dispatch = useDispatch();
    const [hideCompleted, setHideCompleted] = useState(false);

    const { teamLeaveRequests, status } = useSelector((state) => state.manager);
    const { user: loggedInUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchTeamLeaveRequests());
    }, [dispatch]);

    const filteredLeaveRequests = hideCompleted
        ? teamLeaveRequests.filter(req => req.status === 'Pending' || req.status === 'Approved')
        : teamLeaveRequests;

    const handleUpdateStatus = (leaveId, newStatus) => {
        dispatch(updateTeamLeaveRequest({ leaveId, status: newStatus }))
            .unwrap()
            .then(() => message.success(`Request has been ${newStatus.toLowerCase()}.`))
            .catch((err) => message.error(`Failed to update: ${err}`));
    };

    const columns = [
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Start Date', dataIndex: 'startDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'End Date', dataIndex: 'endDate', render: (date) => new Date(date).toLocaleDateString() },
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
            render: (_, record) => {
                const isOwnRequest = record.employee?._id === loggedInUser?._id;
                if (record.status === 'Pending' && !isOwnRequest) {
                    return (
                        <Space size="middle">
                            <Button type="primary" size="small" onClick={() => handleUpdateStatus(record._id, 'Approved')}>Approve</Button>
                            <Button type="primary" danger size="small" onClick={() => handleUpdateStatus(record._id, 'Denied')}>Deny</Button>
                        </Space>
                    );
                }
                return null;
            },
        },
    ];

    return (
        <Card
            title={<Title level={3}>Team Leave Requests</Title>}
            extra={
                <Space align="center">
                    <Text>{hideCompleted ? 'Showing Active Only' : 'Showing All'}</Text>
                    <Switch checked={hideCompleted} onChange={setHideCompleted} />
                </Space>
            }
        >
            <Table
                columns={columns}
                dataSource={filteredLeaveRequests}
                rowKey="_id"
                loading={status === 'loading'}
                pagination={{ pageSize: 10, responsive: true }}
                scroll={{ x: true }}
            />
        </Card>
    );
};

export default TeamPage;