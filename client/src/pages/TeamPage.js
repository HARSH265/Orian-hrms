import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Tag, message, Typography, Card, Switch } from 'antd';
import { fetchTeamLeaveRequests, updateTeamLeaveRequest } from '../features/manager/managerThunks';
import TeamLeaveModal from '../components/TeamLeaveModal';

const { Title, Text } = Typography;

const TeamPage = () => {
    const dispatch = useDispatch();
    const [hideCompleted, setHideCompleted] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState(null);

    const { teamLeaveRequests, status } = useSelector((state) => state.manager);
    const { user: loggedInUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchTeamLeaveRequests());
    }, [dispatch]);

    const filteredLeaveRequests = hideCompleted
        ? teamLeaveRequests.filter(req => req.status === 'Pending')
        : teamLeaveRequests;

    const handleOpenModal = (record) => {
        setSelectedLeaveId(record._id);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedLeaveId(null);
    };

    const handleUpdateStatus = (leaveId, newStatus, managerNotes) => {
        const payload = { leaveId, status: newStatus, managerNotes };
        dispatch(updateTeamLeaveRequest(payload))
            .unwrap()
            .then(() => {
                message.success(`Request has been ${newStatus.toLowerCase()}.`);
                handleCloseModal();
            })
            .catch((err) => message.error(`Failed to update: ${err}`));
    };

    const columns = [
        // ... (columns are the same)
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Start Date', dataIndex: 'startDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'End Date', dataIndex: 'endDate', render: (date) => new Date(date).toLocaleDateString() },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status) => {
                let color = 'default';
                if (status === 'Approved') color = 'success';
                if (status === 'Pending') color = 'warning';
                if (status === 'Denied') color = 'error';
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
                        <Button type="primary" size="small" onClick={() => handleOpenModal(record)}>
                            Review
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    return (
        <>
            <Card
                title={<Title level={3}>Team Leave Requests</Title>}
                extra={
                    <Space align="center">
                        <Text>{hideCompleted ? 'Showing Pending Only' : 'Showing All'}</Text>
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

            <TeamLeaveModal 
                key={selectedLeaveId}
                isOpen={isModalVisible} 
                onCancel={handleCloseModal}
                leaveRequestId={selectedLeaveId}
                onUpdate={handleUpdateStatus}
            />
        </>
    );
};

export default TeamPage;