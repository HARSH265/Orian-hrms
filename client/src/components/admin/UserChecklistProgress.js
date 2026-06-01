import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserChecklists } from '../../features/checklist/checklistThunks';
import { Card, Typography, Progress, List, Tag, Avatar, Tooltip, Space, Spin, Empty } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const UserChecklistProgress = ({ userId }) => {
    const dispatch = useDispatch();
    const { userChecklists, userChecklistsStatus: status } = useSelector((state) => state.checklist);

    useEffect(() => {
        if (userId) {
            dispatch(fetchUserChecklists(userId));
        }
    }, [userId, dispatch]);

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return 0;
        const doneCount = tasks.filter(t => t.status === 'Done').length;
        return Math.round((doneCount / tasks.length) * 100);
    };

    if (status === 'loading') {
        return <div style={{ textAlign: 'center', padding: '40px' }}><Spin /></div>;
    }
    
    if (status === 'succeeded' && userChecklists.length === 0) {
        return <Empty description="No checklists have been applied to this user yet." />;
    }

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {userChecklists.map(instance => (
                <Card key={instance._id}
                    title={instance.template.name}
                    extra={<Tag icon={instance.status === 'Completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />} color={instance.status === 'Completed' ? 'success' : 'processing'}>{instance.status}</Tag>}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                        <Progress type="circle" percent={calculateProgress(instance.generatedTasks)} size={60} />
                        <div style={{ marginLeft: '16px' }}>
                            <Text strong>Applied on:</Text> {new Date(instance.createdAt).toLocaleDateString()} <br />
                            <Text strong>Start Date:</Text> {new Date(instance.startDate).toLocaleDateString()}
                        </div>
                    </div>
                    <List
                        header={<Title level={5}>Tasks</Title>}
                        bordered
                        dataSource={instance.generatedTasks}
                        renderItem={task => (
                            <List.Item>
                                <List.Item.Meta
                                    title={task.title}
                                    description={
                                        <Avatar.Group maxCount={3}>
                                            {task.assignees.map(user => (
                                                <Tooltip title={user.name} key={user._id}>
                                                    <Avatar size="small" src={user.profilePictureUrl}>{user.name.charAt(0)}</Avatar>
                                                </Tooltip>
                                            ))}
                                        </Avatar.Group>
                                    }
                                />
                                <Tag>{task.status}</Tag>
                            </List.Item>
                        )}
                    />
                </Card>
            ))}
        </Space>
    );
};

export default UserChecklistProgress;