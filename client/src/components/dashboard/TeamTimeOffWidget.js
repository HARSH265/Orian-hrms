import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, List, Spin, Tag, Avatar } from 'antd';
import { fetchTeamLeaveRequests } from '../../features/manager/managerThunks';

const { Title, Text } = Typography;

const TeamTimeOffWidget = () => {
    const dispatch = useDispatch();
    const { teamLeaveRequests, status } = useSelector((state) => state.manager);

    useEffect(() => {
        dispatch(fetchTeamLeaveRequests());
    }, [dispatch]);

    // Filter for approved leave that starts today or in the future
    const upcomingLeaves = teamLeaveRequests
        .filter(req => {
            const startDate = new Date(req.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
            return req.status === 'Approved' && startDate >= today;
        })
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate)) // Sort by soonest
        .slice(0, 5); // Show the next 5

    return (
        <Card title={<Title level={4}>Upcoming Team Time Off</Title>}>
            {status === 'loading' && <Spin />}
            {status === 'succeeded' && (
                <List
                    dataSource={upcomingLeaves}
                    renderItem={leave => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={<Avatar src={leave.employee.profilePictureUrl} />}
                                title={leave.employee.name}
                                description={`Starts: ${new Date(leave.startDate).toLocaleDateString()}`}
                            />
                            <Tag color="blue">{leave.leavePolicy?.name || 'Leave'}</Tag>
                        </List.Item>
                    )}
                    locale={{ emptyText: "No upcoming time off for your team." }}
                />
            )}
        </Card>
    );
};

export default TeamTimeOffWidget;