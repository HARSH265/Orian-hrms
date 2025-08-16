import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Popover, List, Typography, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { fetchMyNotifications, markNotificationAsRead } from '../features/notification/notificationThunks';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, unreadCount, status } = useSelector((state) => state.notification);

    useEffect(() => {
        // Fetch notifications when the component mounts
        dispatch(fetchMyNotifications());

        // Optional: Poll for new notifications every minute
        const interval = setInterval(() => {
            dispatch(fetchMyNotifications());
        }, 60000);

        return () => clearInterval(interval); // Cleanup on unmount
    }, [dispatch]);

    const handleNotificationClick = (notification) => {
        // Mark as read if it's not already
        if (!notification.isRead) {
            dispatch(markNotificationAsRead(notification._id));
        }
        // Navigate to the associated link
        navigate(notification.link);
    };

    const notificationContent = (
        <List
            itemLayout="horizontal"
            dataSource={notifications}
            style={{ width: 350 }}
            locale={{ emptyText: "No new notifications" }}
            renderItem={item => (
                <List.Item
                    onClick={() => handleNotificationClick(item)}
                    style={{ 
                        cursor: 'pointer', 
                        backgroundColor: item.isRead ? 'transparent' : '#e6f7ff' 
                    }}
                >
                    <List.Item.Meta
                        title={<Text strong={!item.isRead}>{item.message}</Text>}
                        description={new Date(item.createdAt).toLocaleString()}
                    />
                </List.Item>
            )}
        />
    );

    return (
        <Popover
            content={status === 'loading' ? <Spin /> : notificationContent}
            title="Notifications"
            trigger="click"
            placement="bottomRight"
        >
            <Badge count={unreadCount}>
                <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
            </Badge>
        </Popover>
    );
};

export default NotificationBell;