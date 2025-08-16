import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Row, Col, List, Card, Spin, Alert,Space  } from 'antd';
import { fetchAnnouncements } from '../features/announcement/announcementThunks';

// Import our new widget components
import MyOpenTasks from '../components/dashboard/MyOpenTasks';
import PendingApprovals from '../components/dashboard/PendingApprovals';

const { Title, Paragraph, } = Typography;

const DashboardPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { announcements, status, error } = useSelector((state) => state.announcement);

    useEffect(() => {
        // The dashboard only needs to fetch announcements itself.
        // The widgets will fetch their own data.
        dispatch(fetchAnnouncements());
    }, [dispatch]);

    const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'hr' || user?.role === 'super-admin';

    return (
        <div>
            <Title>Welcome, {user?.name}!</Title>
            <Paragraph>This is your central hub for company news and personal tasks.</Paragraph>
            
            <Row gutter={[24, 24]}>
                {/* --- Left Column: Tasks and Approvals --- */}
                <Col xs={24} lg={12}>
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        {/* Show Pending Approvals widget ONLY to managers and admins */}
                        {isManagerOrAdmin && <PendingApprovals />}
                        
                        {/* Show My Open Tasks widget to everyone */}
                        <MyOpenTasks />
                    </Space>
                </Col>

                {/* --- Right Column: Announcements --- */}
                <Col xs={24} lg={12}>
                    <Card title="Latest Announcements">
                        {status === 'loading' && <Spin />}
                        {error && <Alert message={`Error: ${error}`} type="error" />}
                        {status === 'succeeded' && (
                            <List
                                itemLayout="vertical"
                                dataSource={announcements}
                                renderItem={item => (
                                    <List.Item key={item._id}>
                                        <List.Item.Meta
                                            title={item.title}
                                            description={`Posted by ${item.author?.name} on ${new Date(item.createdAt).toLocaleDateString()}`}
                                        />
                                        <Paragraph>{item.content}</Paragraph>
                                    </List.Item>
                                )}
                                locale={{ emptyText: "No announcements at the moment." }}
                            />
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardPage;