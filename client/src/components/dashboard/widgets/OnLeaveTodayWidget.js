// In: client/src/components/dashboard/widgets/OnLeaveTodayWidget.js

import React from 'react';
import { Card, List, Typography, Spin, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const OnLeaveTodayWidget = ({ metrics, status }) => {
    return (
        <Card style={{ height: '370px' }}>
            <Title level={5}>Team Members on Leave Today</Title>
            {status === 'loading' ? (
                <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
            ) : (
                <List
                    dataSource={metrics.onLeaveToday}
                    locale={{ emptyText: "No one on the team is on leave today." }}
                    renderItem={(item) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar src={item.profilePictureUrl}>{item.employeeName.charAt(0)}</Avatar>}
                                title={<Text strong>{item.employeeName}</Text>}
                                description={`Returns after ${new Date(item.endDate).toLocaleDateString()}`}
                            />
                        </List.Item>
                    )}
                />
            )}
        </Card>
    );
};

export default OnLeaveTodayWidget;