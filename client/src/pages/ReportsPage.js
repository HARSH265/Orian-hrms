import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Row, Col, Spin, Alert } from 'antd';
import { Column, Pie } from '@ant-design/charts'; // Import the chart components
import { fetchLeaveByDepartment, fetchExpensesByCategory } from '../features/report/reportThunks';

const { Title } = Typography;

const ReportsPage = () => {
    const dispatch = useDispatch();
    const { leaveByDepartment, expensesByCategory, status, error } = useSelector((state) => state.report);

    useEffect(() => {
        dispatch(fetchLeaveByDepartment());
        dispatch(fetchExpensesByCategory());
    }, [dispatch]);

    // Configuration for the Leave by Department bar chart
    const leaveConfig = {
    data: leaveByDepartment,
    xField: 'department',
    yField: 'days',
    label: {
        // Position the label at the top of each bar.
        position: 'top', 
        // Optional: Add some style
        style: {
            fill: '#666', // A dark grey color
            opacity: 0.7,
        },
    },
    xAxis: {
        label: { autoHide: true, autoRotate: false },
    },
    meta: {
        department: { alias: 'Department' },
        days: { alias: 'Total Leave Days' },
    },
};

    // Configuration for the Expenses by Category pie chart
   const expenseConfig = {
    appendPadding: 10,
    data: expensesByCategory,
    angleField: 'amount',
    colorField: 'category',
    radius: 0.8,
    legend: {
        position: 'top',
    },
    label: {
        // type: 'inner', // <-- DELETE THIS LINE
        offset: '-50%', // This moves the label 50% from the edge towards the center
        content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
        style: {
            textAlign: 'center',
            fontSize: 14,
            fill: '#fff',
        },
    },
    interactions: [{ type: 'element-selected' }],
};

    if (status === 'loading') {
        return <Spin size="large" />;
    }
    
    if (error) {
        return <Alert message="Error fetching report data" description={error} type="error" />;
    }

    return (
        <div>
            <Title level={2}>Reports & Analytics</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                    <Card title="Leave Days by Department">
                        <Column {...leaveConfig} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Approved Expenses by Category">
                        <Pie {...expenseConfig} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReportsPage;