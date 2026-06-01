import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Progress, List, Avatar, Tooltip, Spin, Empty } from 'antd';
import { fetchActiveChecklists } from '../../features/checklist/checklistThunks';

const { Title, Text } = Typography;

const ChecklistProgressWidget = () => {
    const dispatch = useDispatch();
    const { activeChecklists, activeChecklistsStatus: status } = useSelector((state) => state.checklist);

    useEffect(() => {
        dispatch(fetchActiveChecklists());
    }, [dispatch]);

    const calculateProgress = (tasks) => {
        if (!tasks || tasks.length === 0) return { percent: 100, text: 'N/A' };
        const doneCount = tasks.filter(t => t.status === 'Done').length;
        const totalCount = tasks.length;
        return {
            percent: Math.round((doneCount / totalCount) * 100),
            text: `${doneCount}/${totalCount}`
        };
    };

    return (
        <Card title={<Title level={5}>Active Onboarding & Checklists</Title>}>
            {status === 'loading' && <div style={{textAlign: 'center', padding: '20px'}}><Spin /></div>}
            {status === 'succeeded' && (
                <List
                    itemLayout="horizontal"
                    dataSource={activeChecklists}
                    locale={{ emptyText: "No active checklists for your team." }}
                    renderItem={(instance) => {
                        const progress = calculateProgress(instance.generatedTasks);
                        return (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={
                                        <Tooltip title={instance.targetUser.name}>
                                            <Avatar src={instance.targetUser.profilePictureUrl}>
                                                {instance.targetUser.name.charAt(0)}
                                            </Avatar>
                                        </Tooltip>
                                    }
                                    title={<Text strong>{instance.template.name}</Text>}
                                    description={<Text type="secondary">For: {instance.targetUser.name}</Text>}
                                />
                                <div style={{width: '120px', textAlign: 'right'}}>
                                    <Progress percent={progress.percent} size="small" />
                                    <Text type="secondary">{progress.text} tasks done</Text>
                                </div>
                            </List.Item>
                        );
                    }}
                />
            )}
        </Card>
    );
};

export default ChecklistProgressWidget;