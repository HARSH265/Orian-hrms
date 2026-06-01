import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, Avatar, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

// A simple hashing function to generate a color from a string (department name)
const generateColorFromString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};

const OrgChartNode = ({ data }) => {
    // Generate a consistent border color based on the department name
    const departmentColor = data.department ? generateColorFromString(data.department.name) : '#1890ff';

    return (
        <Card
            bodyStyle={{ padding: '12px' }}
            style={{ 
                width: 200, 
                borderTop: `5px solid ${departmentColor}`, 
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.09)'
            }}
        >
            {/* The Handle is the connection point for ReactFlow edges */}
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar size={48} src={data.profilePictureUrl} icon={<UserOutlined />}>
                    {data.label.charAt(0)}
                </Avatar>
                <div style={{ marginLeft: '12px', overflow: 'hidden' }}>
                    <Text strong style={{ display: 'block' }} ellipsis>{data.label}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>{data.jobTitle || 'N/A'}</Text>
                    {data.department && (
                        <Text style={{ fontSize: '12px', color: departmentColor }} ellipsis>{data.department.name}</Text>
                    )}
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </Card>
    );
};

// Use memo to prevent re-renders of nodes that haven't changed
export default memo(OrgChartNode);