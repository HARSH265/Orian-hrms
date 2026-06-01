import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Button, Typography, Spin, message, Statistic, Row, Col } from 'antd';
import { fetchMyAttendance, clockIn, clockOut } from '../../features/attendance/attendanceThunks';

const { Title, Text } = Typography;

const ClockWidget = () => {
    const dispatch = useDispatch();
    const { todaysRecord, status } = useSelector((state) => state.attendance);

    useEffect(() => {
        dispatch(fetchMyAttendance());
    }, [dispatch]);

    const handleClockIn = () => {
        dispatch(clockIn()).unwrap()
            .then(() => message.success('Clocked in successfully!'))
            .catch((err) => message.error(err));
    };

    const handleClockOut = () => {
        dispatch(clockOut()).unwrap()
            .then(() => message.success('Clocked out successfully!'))
            .catch((err) => message.error(err));
    };

    if (status === 'loading' && !todaysRecord) return <Card><Spin /></Card>;

    const clockedIn = todaysRecord && todaysRecord.clockInTime && !todaysRecord.clockOutTime;
    const clockedOut = todaysRecord && todaysRecord.clockOutTime;
    
    return (
        <Card title={<Title level={4}>My Attendance</Title>}>
            <Row gutter={16} align="middle">
                <Col span={12}>
                    <Statistic title="Status" value={clockedIn ? 'Clocked In' : (clockedOut ? 'Clocked Out' : 'Not Clocked In')} />
                    {todaysRecord?.clockInTime && <Text type="secondary">In at: {new Date(todaysRecord.clockInTime).toLocaleTimeString()}</Text>}
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                    {!clockedIn && !clockedOut && (
                        <Button type="primary" size="large" onClick={handleClockIn} loading={status === 'loading'}>Clock In</Button>
                    )}
                    {clockedIn && (
                        <Button type="primary" danger size="large" onClick={handleClockOut} loading={status === 'loading'}>Clock Out</Button>
                    )}
                    {clockedOut && (
                        <Text type="success">Day Complete!</Text>
                    )}
                </Col>
            </Row>
        </Card>
    );
};

export default ClockWidget;