import React from 'react';
import { Card, Typography, Tabs } from 'antd';
import { useSelector } from 'react-redux';

// Import all the possible tab components
import MyTasksList from '../components/tasks/MyTasksList';
import TeamTasks from '../components/tasks/TeamTasks';
import AllSystemTasks from '../components/tasks/AllSystemTasks';

const { Title } = Typography;

const HighLevelTasksPage = () => {
  const { user } = useSelector((state) => state.auth);

  // Start with the tab that everyone gets
  const tabItems = [
    {
      key: 'my-tasks',
      label: `My Tasks`,
      children: <MyTasksList />,
    },
  ];

  // If the user is a manager, add the "Team Tasks" tab
  if (user.role === 'manager') {
    tabItems.push({
      key: 'team-tasks',
      label: `Team Tasks`,
      children: <TeamTasks />,
    });
  }
  
  // If the user is HR or Super-Admin, add the "All System Tasks" tab
  if (user.role === 'hr' || user.role === 'super-admin') {
    tabItems.push({
      key: 'all-tasks',
      label: `All System Tasks`,
      children: <AllSystemTasks />,
    });
  }

  return (
    <Card>
      <Title level={3}>Task Management</Title>
      <Tabs defaultActiveKey="my-tasks" items={tabItems} />
    </Card>
  );
};

export default HighLevelTasksPage;