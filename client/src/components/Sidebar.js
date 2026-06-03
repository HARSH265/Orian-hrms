

import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Menu } from 'antd';
import {
  AppstoreOutlined,
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  CheckSquareOutlined,
  ReadOutlined,
  TeamOutlined,
  SettingOutlined,
  DashboardOutlined,
  ApartmentOutlined,
  HddOutlined,
  FileDoneOutlined,
  NotificationOutlined,
  SolutionOutlined,
  ClockCircleOutlined,
  BulbOutlined,
  BookOutlined,
  BarChartOutlined,
  QuestionCircleOutlined,
  FolderOpenOutlined,
  ToolOutlined,
  NodeIndexOutlined,
  UserSwitchOutlined
  
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Sider } = Layout;

const getParentKeysMap = (items) => {
    const keyMap = {};
    const traverse = (menuItems) => {
        menuItems.forEach(item => {
            if (item.children) {
                item.children.forEach(child => { keyMap[child.key] = item.key; });
                traverse(item.children);
            }
        });
    };
    traverse(items);
    return keyMap;
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [openKeys, setOpenKeys] = useState([]);

  const accessibleItems = useMemo(() => {
    if (!user) return [];

    const allMenuItems = [
        { key: 'my-workspace', icon: <AppstoreOutlined />, label: 'My Workspace', roles: ['employee', 'manager', 'hr', 'super-admin'], children: [
            { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">My Profile</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
            { key: '/directory', icon: <TeamOutlined />, label: <Link to="/directory">Directory</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
            { key: '/leave', icon: <CalendarOutlined />, label: <Link to="/leave">My Leave</Link>, roles: ['employee', 'manager', 'hr'] },
            { key: '/expenses', icon: <DollarOutlined />, label: <Link to="/expenses">My Expenses</Link>, roles: ['employee', 'manager', 'hr'] },
            { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks">My Tasks</Link>, roles: ['employee'] },
            { key: '/performance', icon: <SolutionOutlined />, label: <Link to="/performance">Performance</Link>, roles: ['employee', 'manager'] },
            { key: '/attendance', icon: <ClockCircleOutlined />, label: <Link to="/attendance">My Attendance</Link>, roles: ['employee', 'manager', 'hr'] },
            { key: '/surveys', icon: <QuestionCircleOutlined />, label: <Link to="/surveys">My Surveys</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
            { key: '/documents', icon: <FolderOpenOutlined />, label: <Link to="/documents">Documents</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        ]},
        { key: '/jobs', icon: <ReadOutlined />, label: <Link to="/jobs">Job Openings</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        { key: 'management', icon: <TeamOutlined />, label: 'Management', roles: ['manager', 'hr', 'super-admin'], children: [
            { key: '/team', icon: <TeamOutlined />, label: <Link to="/team">My Team</Link> },
            { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks">Task Management</Link> },
            { key: '/expenses/approvals', icon: <DollarOutlined />, label: <Link to="/expenses/approvals">{(user.role === 'hr' || user.role === 'super-admin') ? 'Global Expense' : 'Team Expenses'}</Link> },
            { key: '/team/attendance', icon: <ClockCircleOutlined />, label: <Link to="/team/attendance">Team Attendance</Link>, roles: ['manager', 'hr', 'super-admin'] },
        ]},
        { key: 'administration', icon: <SettingOutlined />, label: 'Administration', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/reports&analytics">Reports&Analytics</Link> },
            { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users">User Management</Link> },
             { key: '/admin/org-chart-editor', icon: <NodeIndexOutlined />, label: <Link to="/admin/org-chart-editor">Org Chart Editor</Link> },
            { key: '/admin/departments', icon: <ApartmentOutlined />, label: <Link to="/admin/departments">Departments</Link> },
            { key: '/admin/announcements', icon: <NotificationOutlined />, label: <Link to="/admin/announcements">Announcements</Link> },
            { key: '/admin/performance', icon: <SolutionOutlined />, label: <Link to="/admin/performance">Performance Cycles</Link>, roles: ['hr', 'super-admin'] },
            { key: '/admin/skills', icon: <BulbOutlined />, label: <Link to="/admin/skills">Skill Library</Link> },
            { key: '/admin/roles', icon: <UserSwitchOutlined />, label: <Link to="/admin/roles">Role Management</Link>, roles: ['super-admin'] },
            { key: '/admin/settings', icon: <ToolOutlined />, label: <Link to="/admin/settings">System Settings</Link>, roles: ['super-admin'] },
        ]},
        { key: 'hr-modules', icon: <FileDoneOutlined />, label: 'HR Modules', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/leaves', icon: <CalendarOutlined />, label: <Link to="/admin/leaves">Leave Admin</Link> },
            { key: '/admin/leave-policies', icon: <BookOutlined />, label: <Link to="/admin/leave-policies">Leave Policies</Link> },
            { key: '/admin/assets', icon: <HddOutlined />, label: <Link to="/admin/assets">Asset Management</Link> },
            { key: '/admin/checklist-templates', icon: <FileDoneOutlined />, label: <Link to="/admin/checklist-templates">Checklist Templates</Link> },
            { key: '/admin/surveys', icon: <BarChartOutlined />, label: <Link to="/admin/surveys">Surveys</Link> },
             { key: '/admin/documents', icon: <BookOutlined />, label: <Link to="/admin/documents">Documents</Link> },
            // --- THIS IS THE FIX: The duplicate key has been removed ---
        ]},
        { key: 'recruiting', icon: <ReadOutlined />, label: 'Recruiting', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/jobs', icon: <ReadOutlined />, label: <Link to="/admin/jobs">Manage Jobs</Link> },
            { key: '/admin/referrals', icon: <TeamOutlined />, label: <Link to="/admin/referrals">View Referrals</Link> },
        ]}
    ];

    const filterMenu = (items) => {
        return items.map(item => {
            if (item.roles && !item.roles.includes(user.systemRole)) return null;
            if (item.children) {
                const filteredChildren = filterMenu(item.children);
                if (filteredChildren.length > 0) return { ...item, children: filteredChildren };
                return null;
            }
            return item;
        }).filter(Boolean);
    };
    
    return filterMenu(allMenuItems);
  }, [user]);

  const parentKeysMap = useMemo(() => getParentKeysMap(accessibleItems), [accessibleItems]);

  useEffect(() => {
    const parentKey = parentKeysMap[location.pathname];
    setOpenKeys(parentKey ? [parentKey] : []);
  }, [location.pathname, parentKeysMap]);

  const onOpenChange = (keys) => { setOpenKeys(keys); };
  
  return (
    <Sider collapsible theme="dark" breakpoint="lg" collapsedWidth="80" width={250}>
      <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', lineHeight: '32px', color: 'white', fontWeight: 'bold', borderRadius: '6px' }}>
        Orion
      </div>
      <Menu
        theme="dark"
        mode="inline"
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        selectedKeys={[location.pathname]}
        items={accessibleItems}
      />
    </Sider>
  );
};

export default Sidebar;