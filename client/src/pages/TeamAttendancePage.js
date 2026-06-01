import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Table, Tag, Typography, Spin, Alert, Tooltip } from 'antd';
import { fetchTeamAttendance } from '../features/attendance/attendanceThunks';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Helper function to format hours nicely
const formatHours = (hours) => {
    if (!hours || hours <= 0) return 'N/A';
    return `${hours.toFixed(2)} hrs`;
};

const TeamAttendancePage = () => {
    const dispatch = useDispatch();
    // Note: We are using 'teamRecords' from the slice
    const { teamRecords, status, error } = useSelector((state) => state.attendance);

    useEffect(() => {
        dispatch(fetchTeamAttendance());
    }, [dispatch]);

    const columns = [
        {
            title: 'Employee',
            dataIndex: ['employee', 'name'],
            key: 'employeeName',
        },
        {
            title: 'Clock In Time',
            dataIndex: 'clockInTime',
            key: 'clockInTime',
            render: (time) => time ? new Date(time).toLocaleTimeString() : <Tag color="orange">Not Clocked In</Tag>,
        },
        {
            title: 'Clock Out Time',
            dataIndex: 'clockOutTime',
            key: 'clockOutTime',
            render: (time) => time ? new Date(time).toLocaleTimeString() : <Tag>N/A</Tag>,
        },
        {
            title: 'Status',
            key: 'currentStatus',
            render: (_, record) => {
                if (record.clockOutTime) {
                    return <Tag color="success">Day Complete</Tag>;
                }
                if (record.clockInTime) {
                    return <Tag color="processing">Clocked In</Tag>;
                }
                return <Tag>N/A</Tag>;
            }
        },
        {
            title: 'Total Hours (Today)',
            dataIndex: 'totalHours',
            key: 'totalHours',
            render: (hours) => formatHours(hours),
        },
    ];

    return (
        <Card>
            <Title level={3}>Team Attendance</Title>
            <Text type="secondary">
                Showing your team's attendance status for today, {new Date().toLocaleDateString()}. 
                <Tooltip title="This page automatically refreshes when you visit. For historical data, please contact HR.">
                    <InfoCircleOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
                </Tooltip>
            </Text>
            {error && <Alert message={error} type="error" style={{ marginTop: 16 }} />}
            <Table
                columns={columns}
                dataSource={teamRecords}
                rowKey={(record) => record.employee._id} // Use employee ID as key for today's records
                loading={status === 'loading'}
                pagination={false} // It's just for today, so no pagination needed
                style={{ marginTop: 16 }}
                scroll={{ x: true }}
            />
        </Card>
    );
};

export default TeamAttendancePage;