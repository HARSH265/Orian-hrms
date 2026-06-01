import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Row, Col, List, Card, Spin, Alert, Button, Tabs, Skeleton } from 'antd';
import { UserOutlined, ReadOutlined, TeamOutlined } from '@ant-design/icons';
import { fetchAnnouncements } from '../features/announcement/announcementThunks';

// Import all dashboard widgets
import MyOpenTasksWidget from '../components/dashboard/MyOpenTasks';
import PendingApprovalsWidget from '../components/dashboard/PendingApprovals';
import ClockWidget from '../components/dashboard/ClockWidget';
import MyLeaveBalancesWidget from '../components/dashboard/MyLeaveBalancesWidget';
import TeamTimeOffWidget from '../components/dashboard/TeamTimeOffWidget';
import ChecklistProgressWidget from '../components/dashboard/ChecklistProgressWidget'; // <-- IMPORT NEW WIDGET

import KudosFeed from '../components/kudos/KudosFeed';
import GiveKudosModal from '../components/kudos/GiveKudosModal';

const { Title, Paragraph, Text } = Typography;

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { announcements, status: announcementStatus, error } = useSelector((state) => state.announcement);
    
    const [isKudosModalVisible, setIsKudosModalVisible] = useState(false); 

    useEffect(() => {
        dispatch(fetchAnnouncements());
    }, [dispatch]);

    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'super-admin';

    const tabItems = [
        {
            key: '1',
            label: (<span><UserOutlined />My Dashboard</span>),
            children: (
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>{user?.role !== 'super-admin' && <ClockWidget />}</Col>
                    <Col xs={24} lg={12}>{user?.role !== 'super-admin' && <MyOpenTasksWidget />}</Col>
                    <Col xs={24} lg={12}>{user?.role !== 'super-admin' && <MyLeaveBalancesWidget />}</Col>
                </Row>
            ),
        },
        {
            key: '2',
            label: (<span><ReadOutlined />Company</span>),
            children: (
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={14}>
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Title level={4} style={{ margin: 0 }}>Company Feed</Title>
                                <Button type="primary" onClick={() => setIsKudosModalVisible(true)}>Give Kudos</Button>
                            </div>
                            <KudosFeed />
                        </Card>
                    </Col>
                    <Col xs={24} lg={10}>
                         <Card title="Latest Announcements">
                            {announcementStatus === 'loading' && <Skeleton active paragraph={{ rows: 4 }} />}
                            {error && <Alert message={`Error: ${error}`} type="error" />}
                            {announcementStatus === 'succeeded' && (
                                <List
                                    itemLayout="vertical"
                                    dataSource={announcements.slice(0, 3)} // Show top 3
                                    renderItem={item => (
                                        <List.Item key={item._id}>
                                            <List.Item.Meta
                                                title={<Text strong>{item.title}</Text>}
                                                description={`By ${item.author?.name} on ${new Date(item.createdAt).toLocaleDateString()}`}
                                            />
                                        </List.Item>
                                    )}
                                    locale={{ emptyText: "No announcements." }}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        }
    ];

    if (isManagerOrAdmin) {
        tabItems.push({
            key: '3',
            label: (<span><TeamOutlined />Management</span>),
            children: (
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}><PendingApprovalsWidget /></Col>
                    <Col xs={24} lg={12}><TeamTimeOffWidget /></Col>
                    {/* --- NEW: Add the checklist widget to the management tab --- */}
                    <Col xs={24} lg={24}><ChecklistProgressWidget /></Col>
                </Row>
            ),
        });
    }

    return (
        <div>
            <Title level={2}>Welcome, {user?.name}!</Title>
            <Paragraph type="secondary">This is your central hub for company news and personal tasks.</Paragraph>
            
            <Tabs defaultActiveKey="1" items={tabItems} />

            <GiveKudosModal visible={isKudosModalVisible} onCancel={() => setIsKudosModalVisible(false)} />
        </div>
    );
};

export default DashboardPage;

