import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, List, Spin, Progress } from 'antd';
import { fetchMyLeaveBalances } from '../../features/leave-policy/leavePolicyThunks';

const { Title, Text } = Typography;

const MyLeaveBalancesWidget = () => {
    const dispatch = useDispatch();
    const { myBalances, status } = useSelector((state) => state.leavePolicy);

    useEffect(() => {
        dispatch(fetchMyLeaveBalances());
    }, [dispatch]);

    return (
        <Card title={<Title level={4}>My Leave Balances</Title>}>
            {status === 'loading' && <Spin />}
            {status === 'succeeded' && (
                <List
                    dataSource={myBalances}
                    renderItem={balance => {
                        const remaining = balance.totalDays - balance.daysTaken;
                        const percent = (remaining / balance.totalDays) * 100;
                        return (
                            <List.Item>
                                <List.Item.Meta title={balance.leavePolicy.name} />
                                <div style={{ textAlign: 'right' }}>
                                    <Text strong>{remaining} / {balance.totalDays}</Text>
                                    <Text type="secondary"> days remaining</Text>
                                    <Progress percent={percent} showInfo={false} />
                                </div>
                            </List.Item>
                        )
                    }}
                    locale={{ emptyText: "No leave policies assigned." }}
                />
            )}
        </Card>
    );
};

export default MyLeaveBalancesWidget;