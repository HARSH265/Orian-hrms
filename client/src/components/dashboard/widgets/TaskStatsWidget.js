// In: client/src/components/dashboard/widgets/TaskStatsWidget.js

import React from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, ClockCircleOutlined, HddOutlined } from '@ant-design/icons';

const { Title } = Typography;

const MetricCard = ({ title, value, icon, color, loading }) => (
    <Card style={{ borderLeft: `5px solid ${color || '#1890ff'}`, borderRadius: '8px' }}>
        {loading ? <Spin /> : <Statistic title={title} value={value} prefix={icon} />}
    </Card>
);

const TaskStatsWidget = ({ metrics, status }) => {
    const loading = status === 'loading';

    return (
        <div style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Task Overview</Title>
            <Row gutter={[24, 24]}>
                <Col xs={12} sm={12} md={6}>
                    <MetricCard title="Total Tasks" value={metrics.totalTasks} icon={<HddOutlined />} loading={loading} />
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <MetricCard title="Overdue" value={metrics.overdueTasks} icon={<ExclamationCircleOutlined />} color="#ff4d4f" loading={loading} />
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <MetricCard title="Completed Today" value={metrics.completedToday} icon={<CheckCircleOutlined />} color="#52c41a" loading={loading} />
                </Col>
                <Col xs={12} sm={12} md={6}>
                    <MetricCard title="In Progress" value={metrics.tasksByStatus?.InProgress || 0} icon={<ClockCircleOutlined />} color="#1677ff" loading={loading} />
                </Col>
            </Row>
        </div>
    );
};

export default TaskStatsWidget;