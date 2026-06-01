// src/pages/PerformancePage.js
import React from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Tabs } from 'antd';
// We will create these two components next
import MyReviews from '../components/performance/MyReviews'; 
import TeamReviews from '../components/performance/TeamReviews';

const { Title } = Typography;

const PerformancePage = () => {
    const { user } = useSelector((state) => state.auth);

    const tabItems = [
        { key: 'my-reviews', label: 'My Reviews', children: <MyReviews /> }
    ];

    if (user.role === 'manager') {
        tabItems.push({ key: 'team-reviews', label: 'Team Reviews', children: <TeamReviews /> });
    }

    return (
        <Card>
            <Title level={3}>Performance Reviews</Title>
            <Tabs defaultActiveKey="my-reviews" items={tabItems} />
        </Card>
    );
};

export default PerformancePage;