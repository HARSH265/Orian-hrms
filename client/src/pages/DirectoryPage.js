import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Spin, Alert, Table, Tabs, Avatar, Space, Input } from 'antd';
import { fetchDirectoryUsers, fetchOrgChartData } from '../features/directory/directoryThunks';
import { Tree, TreeNode } from 'react-organizational-chart';
import styled from 'styled-components';

const { Title, Text } = Typography;
const { Search } = Input

const StyledNode = styled.div`
  padding: 8px 12px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid #1890ff;
  background-color: #fff;
`;

// This recursive component builds the tree for the react-organizational-chart library
const ChartNode = ({ user, allUsers }) => {
    const children = allUsers.filter(u => u.pid === user.id);
    return (
        <TreeNode label={<StyledNode><Text strong>{user.name}</Text><br /><Text type="secondary">{user.title}</Text></StyledNode>}>
            {children.map(child => (
                <ChartNode key={child.id} user={child} allUsers={allUsers} />
            ))}
        </TreeNode>
    );
};

const DirectoryPage = () => {
    const dispatch = useDispatch();
    const { users, orgChartData, status, error } = useSelector((state) => state.directory);
 
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(fetchDirectoryUsers());
        dispatch(fetchOrgChartData());
    }, [dispatch]);

    const filteredDirectoryUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.jobTitle && user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const directoryColumns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (text, record) => (<Space><Avatar src={record.profilePictureUrl} /><span>{text}</span></Space>)},
        { title: 'Job Title', dataIndex: 'jobTitle', key: 'jobTitle' },
        { title: 'Department', dataIndex: ['department', 'name'], key: 'department' },
        { title: 'Manager', dataIndex: ['manager', 'name'], key: 'manager' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
    ];
    
    const rootNode = orgChartData.find(u => !u.pid);

    const tabItems = [
        {
            key: '1',
            label: 'Directory List',
            children: ( 
            <div>
                    {/* --- 3. NEW: The Search Bar UI --- */}
                    <Search
                        placeholder="Search by name, email, or job title..."
                        onSearch={(value) => setSearchTerm(value)}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 16, maxWidth: 400 }}
                        allowClear
                    />
                    {/* --- END OF NEW UI --- */}

                    <Table
                        columns={directoryColumns}
                        dataSource={filteredDirectoryUsers} // <-- 4. USE THE FILTERED DATA
                        rowKey="_id"
                        loading={status === 'loading'}
                    />
                </div>
                 )
        },
        {
            key: '2',
            label: 'Organization Chart',
            children: (
                <div style={{ textAlign: 'center', background: '#f5f5f5', padding: '24px', borderRadius: '8px', overflowX: 'auto' }}>
                    {status === 'succeeded' && rootNode ? (
                        <Tree
                            lineWidth={'2px'}
                            lineColor={'#1890ff'}
                            lineBorderRadius={'10px'}
                            label={<StyledNode><Title level={5}>{rootNode.name}</Title><Text type="secondary">{rootNode.title}</Text></StyledNode>}
                        >
                            {orgChartData
                                .filter(u => u.pid === rootNode.id)
                                .map(childNode => (
                                    <ChartNode key={childNode.id} user={childNode} allUsers={orgChartData} />
                                ))
                            }
                        </Tree>
                    ) : (
                        <Spin />
                    )}
                </div>
            )
        }
    ];

    if (error) { return <Alert message="Error fetching directory data" description={error} type="error" />; }

    return (
        <Card>
            <Title level={2}>Company Directory</Title>
            <Tabs defaultActiveKey="1" items={tabItems} />
        </Card>
    );
};

export default DirectoryPage;