import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Row, Col, List, Button, Tabs } from 'antd';
import { Link } from 'react-router-dom';
import { fetchDataHealth, fetchTaskMetrics, fetchLeaveMetrics } from '../features/dashboard/dashboardThunks';

// Import the new widgets
import TaskStatsWidget from '../components/dashboard/widgets/TaskStatsWidget';
import TasksByStatusPieChart from '../components/dashboard/widgets/TasksByStatusPieChart';
import OnLeaveTodayWidget from '../components/dashboard/widgets/OnLeaveTodayWidget';

const { Title, Text } = Typography;

const AdminDashboardPage = () => {
    const dispatch = useDispatch();
    
    // Select all the different pieces of state from the dashboard slice
    const { 
        usersWithoutManager, deptsWithoutHOD, dataHealthStatus,
        taskMetrics, taskMetricsStatus,
        leaveMetrics, leaveMetricsStatus
    } = useSelector((state) => state.dashboard);

    useEffect(() => {
        // Dispatch all data fetching actions for the dashboard
        dispatch(fetchDataHealth());
        dispatch(fetchTaskMetrics());
        dispatch(fetchLeaveMetrics());
    }, [dispatch]);

    const dataHealthItems = (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
                <Card title={`Users Without a Manager (${usersWithoutManager.length})`}>
                    <List
                        loading={dataHealthStatus === 'loading'}
                        dataSource={usersWithoutManager}
                        renderItem={user => ( <List.Item actions={[<Link to="/admin/users"><Button type="link">Fix</Button></Link>]}><List.Item.Meta title={user.name} description={`Role: ${user.role}`} /></List.Item> )}
                        locale={{ emptyText: "All users are correctly assigned." }}
                    />
                </Card>
            </Col>
            <Col xs={24} lg={12}>
                <Card title={`Departments Without a Head (${deptsWithoutHOD.length})`}>
                    <List
                        loading={dataHealthStatus === 'loading'}
                        dataSource={deptsWithoutHOD}
                        renderItem={dept => ( <List.Item actions={[<Link to="/admin/departments"><Button type="link">Fix</Button></Link>]}><List.Item.Meta title={dept.name} /></List.Item> )}
                        locale={{ emptyText: "All departments have a Head." }}
                    />
                </Card>
            </Col>
        </Row>
    );

    const analyticsItems = (
        <Row gutter={[24, 24]}>
            <Col span={24}>
                <TaskStatsWidget metrics={taskMetrics} status={taskMetricsStatus} />
            </Col>
            <Col xs={24} lg={12}>
                <TasksByStatusPieChart metrics={taskMetrics} status={taskMetricsStatus} />
            </Col>
            <Col xs={24} lg={12}>
                <OnLeaveTodayWidget metrics={leaveMetrics} status={leaveMetricsStatus} />
            </Col>
        </Row>
    );

    const tabItems = [
        { key: '1', label: 'Analytics Overview', children: analyticsItems },
        { key: '2', label: 'Data Health', children: dataHealthItems },
    ];

    return (
        <div>
            <Title level={2}>Reports & Analytics</Title>
            <Text type="secondary">An overview of operational metrics and data integrity.</Text>
            <Tabs defaultActiveKey="1" items={tabItems} style={{ marginTop: '24px' }} />
        </div>
    );
};

export default AdminDashboardPage;