import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Row, Col, Spin, Alert, List, Button } from 'antd';
import { Link } from 'react-router-dom'; // To link to other pages
import { fetchDataHealth } from '../features/dashboard/dashboardThunks';

const { Title, Text } = Typography;

const AdminDashboardPage = () => {
    const dispatch = useDispatch();
    const { usersWithoutManager, deptsWithoutHOD, status, error } = useSelector((state) => state.dashboard);

    useEffect(() => {
        dispatch(fetchDataHealth());
    }, [dispatch]);

    if (status === 'loading') {
        return <Spin size="large" />;
    }
    
    if (error) {
        return <Alert message="Error fetching dashboard data" description={error} type="error" />;
    }

    return (
        <div>
            <Title level={2}>Admin Dashboard</Title>
            <Text type="secondary">A quick overview of data health and system status.</Text>

            <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title={`Users Without a Manager (${usersWithoutManager.length})`}>
                        <List
                            dataSource={usersWithoutManager}
                            renderItem={user => (
                                <List.Item
                                    actions={[
                                        // This link will take the admin to the main user page.
                                        // A more advanced version could open the edit modal directly.
                                        <Link to="/admin/users">
                                            <Button type="link">Go to User Mgt</Button>
                                        </Link>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={user.name}
                                        description={`Role: ${user.role} | Email: ${user.email}`}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: "All users are correctly assigned a manager." }}
                        />
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title={`Departments Without a Head (${deptsWithoutHOD.length})`}>
                        <List
                            dataSource={deptsWithoutHOD}
                            renderItem={dept => (
                                <List.Item
                                     actions={[
                                        <Link to="/admin/departments">
                                            <Button type="link">Go to Dept Mgt</Button>
                                        </Link>
                                    ]}
                                >
                                    <List.Item.Meta
                                        title={dept.name}
                                    />
                                </List.Item>
                            )}
                            locale={{ emptyText: "All departments have an assigned Head." }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboardPage;