import React from 'react';
import { Card, Spin, Typography, Empty } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const { Title } = Typography;

// --- A softer, more modern and accessible color palette ---
const COLORS = {
    ToDo: '#5B8FF9',       // A pleasant blue
    InProgress: '#F6BD16', // A soft gold/yellow
    Done: '#5AD8A6',       // A gentle green
    Blocked: '#E8684A',    // A muted red/orange
};

// --- A custom tooltip for a more polished look ---
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#fff',
                border: '1px solid #ccc',
                padding: '10px',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
                <p style={{ margin: 0 }}>{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

const TasksByStatusPieChart = ({ metrics, status }) => {
    const data = Object.entries(metrics.tasksByStatus).map(([name, value]) => ({
        name: name.replace(/([A-Z])/g, ' $1').trim(), // Add space before capital letters, e.g., InProgress -> In Progress
        value
    }));

    if (status === 'loading') {
        return <Card style={{ height: '370px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></Card>;
    }
    
    if (data.length === 0) {
        return <Card style={{ height: '370px' }}><Title level={5}>Tasks by Status</Title><Empty description="No task data available." /></Card>;
    }

    return (
        <Card style={{ height: '370px' }}>
            <Title level={5}>Tasks by Status</Title>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={110}
                        innerRadius={60} // Creates a Donut Chart, which is often considered more modern
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={5} // Adds spacing between segments
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name.replace(/\s+/g, '')] || '#cccccc'} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </Card>
    );
};

export default TasksByStatusPieChart;