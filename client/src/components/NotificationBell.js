import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Popover, List, Typography, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { fetchMyNotifications, markNotificationAsRead } from '../features/notification/notificationThunks';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { notifications, status } = useSelector((state) => state.notification);

    // 🔹 Local state for only unread notifications
    const [visibleNotifications, setVisibleNotifications] = useState([]);

    useEffect(() => {
        // Fetch notifications initially
        dispatch(fetchMyNotifications());

        // Poll every 60 sec
        const interval = setInterval(() => {
            dispatch(fetchMyNotifications());
        }, 60000);

        return () => clearInterval(interval);
    }, [dispatch]);

    // 🔹 Sync only unread notifications
    useEffect(() => {
        const unread = notifications.filter(n => !n.isRead);
        setVisibleNotifications(unread);
    }, [notifications]);

    const handleNotificationClick = (notification) => {
        if (!notification.isRead) {
            dispatch(markNotificationAsRead(notification._id));
        }

        // Navigate to notification link
        navigate(notification.link);

        // 🔹 Remove from UI immediately (not from DB)
        setVisibleNotifications(prev =>
            prev.filter(n => n._id !== notification._id)
        );
    };

    const notificationContent = (
        <List
            itemLayout="horizontal"
            dataSource={visibleNotifications}
            style={{ 
                width: 350, 
                maxHeight: 400,     // 🔹 Fix height
                overflowY: 'auto'   // 🔹 Scroll enabled
            }}
            locale={{ emptyText: "No new notifications" }}
            renderItem={item => (
                <List.Item
                    onClick={() => handleNotificationClick(item)}
                    style={{ 
                        cursor: 'pointer', 
                        backgroundColor: '#e6f7ff' 
                    }}
                >
                    <List.Item.Meta
                        title={<Text strong>{item.message}</Text>}
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
            <Badge count={visibleNotifications.length}>
                <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
            </Badge>
        </Popover>
    );
};

export default NotificationBell;
