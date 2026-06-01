import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Typography, Spin, Alert } from 'antd';
import StatusTag from '../components/common/StatusTag';
// Let's rename the thunk for clarity as discussed
import { fetchMyAttendance } from '../features/attendance/attendanceThunks';

const { Title, Text } = Typography;

// Helper function to format hours nicely
const formatHours = (hours) => {
    if (!hours || hours <= 0) return 'N/A';
    return `${hours.toFixed(2)} hrs`;
};

const MyAttendancePage = () => {
    const dispatch = useDispatch();
    // Note: We are using 'myRecords' from the slice, which is populated by this thunk
    const { myRecords, status, error } = useSelector((state) => state.attendance);

    useEffect(() => {
        // We'll create a dedicated thunk for this page to be cleaner
        dispatch(fetchMyAttendance());
    }, [dispatch]);

    const columns = [
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
            render: (date) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Clock In Time',
            dataIndex: 'clockInTime',
            key: 'clockInTime',
            render: (time) => time ? new Date(time).toLocaleTimeString() : 'N/A',
        },
        {
            title: 'Clock Out Time',
            dataIndex: 'clockOutTime',
            key: 'clockOutTime',
            render: (time) => time ? new Date(time).toLocaleTimeString() : 'N/A',
        },
        {
            title: 'Total Hours',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (hours) => formatHours(hours),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <StatusTag status={status} />,
        },
    ];

    return (
        <Card>
            <Title level={3}>My Attendance History</Title>
            <Text type="secondary">Showing your records for the last 30 days.</Text>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
            <Table
                columns={columns}
                dataSource={myRecords}
                rowKey="_id"
                loading={status === 'loading'}
                pagination={{ pageSize: 15 }}
                style={{ marginTop: 16 }}
                scroll={{ x: true }}
            />
        </Card>
    );
};

export default MyAttendancePage;