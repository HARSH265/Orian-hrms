import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, message, Typography, Card, Switch } from 'antd';
import { fetchAllSystemLeaves, adminUpdateLeaveStatus } from '../features/admin-leaves/adminLeavesThunks';
// --- V2 FIX: Import BOTH modals ---
import TeamLeaveModal from '../components/TeamLeaveModal';
import LeaveDetailsModal from '../components/LeaveDetailsModal';
import StatusTag from '../components/common/StatusTag';

const { Title, Text } = Typography;

const AdminLeavePage = () => {
    const dispatch = useDispatch();
    const [hideCompleted, setHideCompleted] = useState(false);

    // --- V2 FIX: State for BOTH modals ---
    const [isActionModalVisible, setIsActionModalVisible] = useState(false); // For TeamLeaveModal
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false); // For LeaveDetailsModal
    const [selectedLeave, setSelectedLeave] = useState(null); // Store the full leave object

    const { allLeaves, status } = useSelector((state) => state.adminLeaves);
    const { user: loggedInUser } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchAllSystemLeaves());
    }, [dispatch]);

    const filteredLeaves = hideCompleted
        ? allLeaves.filter(req => req.status === 'Pending')
        : allLeaves;

    // --- V2 FIX: A smarter handler that decides which modal to open ---
    const handleReviewClick = (record) => {
        setSelectedLeave(record);
        if (record.status === 'Pending') {
            setIsActionModalVisible(true); // Open the modal with Approve/Deny buttons
        } else {
            setIsDetailsModalVisible(true); // Open the read-only details modal
        }
    };

    const handleCloseModals = () => {
        setIsActionModalVisible(false);
        setIsDetailsModalVisible(false);
        setSelectedLeave(null);
    };

    const handleUpdateStatus = (leaveId, newStatus, managerNotes) => {
        const payload = { leaveId, status: newStatus, managerNotes };
        dispatch(adminUpdateLeaveStatus(payload))
            .unwrap()
            .then(() => {
                message.success(`Request has been ${newStatus.toLowerCase()}.`);
                handleCloseModals(); // Close the action modal
            })
            .catch((err) => message.error(`Failed to update: ${err}`));
    };

    const columns = [
        { title: 'Employee', dataIndex: ['employee', 'name'], key: 'employeeName' },
        { title: 'Start Date', dataIndex: 'startDate', render: (date) => new Date(date).toLocaleDateString() },
        { title: 'End Date', dataIndex: 'endDate', render: (date) => new Date(date).toLocaleDateString() },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status) => <StatusTag status={status} />,
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                const isOwnRequest = record.employee?._id === loggedInUser?._id;
                if (isOwnRequest) return null;

                // --- V2 FIX: The button text now changes based on status ---
                const buttonText = record.status === 'Pending' ? 'Review & Act' : 'View Details';
                return (
                    <Button type="primary" size="small" onClick={() => handleReviewClick(record)}>
                        {buttonText}
                    </Button>
                );
            },
        },
    ];

    return (
        <>
            <Card
                title={<Title level={3}>All Leave Requests (Admin View)</Title>}
                extra={
                    <Space align="center">
                        <Text>{hideCompleted ? 'Showing Pending Only' : 'Showing All'}</Text>
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

            {/* --- V2 FIX: Render BOTH modals, but only one will be visible at a time --- */}
            
            {/* The modal for taking action on PENDING requests */}
            <TeamLeaveModal 
                key={selectedLeave?._id || 'action-modal'}
                isOpen={isActionModalVisible} 
                onCancel={handleCloseModals}
                leaveRequestId={selectedLeave?._id}
                onUpdate={handleUpdateStatus}
            />

            {/* The modal for viewing details of PROCESSED requests */}
            <LeaveDetailsModal
                key={selectedLeave?._id || 'details-modal'}
                isOpen={isDetailsModalVisible}
                onCancel={handleCloseModals}
                leaveDetails={selectedLeave}
            />
        </>
    );
};

export default AdminLeavePage;