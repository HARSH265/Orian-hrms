import React from 'react';
import { Tag } from 'antd';

const statusColorMap = {
    'Approved': 'success',
    'Pending': 'warning',
    'Denied': 'error',
    'Withdrawn': 'default',
    'Paid': 'success',
    'Rejected': 'error',
    'Open': 'processing',
    'Closed': 'default',
    'Present': 'success',
    'On Leave': 'blue',
    'Holiday': 'gold',
    'Absent': 'error',
    'Assigned': 'processing',
    'Available': 'success',
    'Retired': 'error',
    'To Do': 'default',
    'In Progress': 'processing',
    'Done': 'success',
    'Complete': 'success',
};

const StatusTag = ({ status }) => {
    const color = statusColorMap[status] || 'default';
    return <Tag color={color}>{status}</Tag>;
};

export default StatusTag;
