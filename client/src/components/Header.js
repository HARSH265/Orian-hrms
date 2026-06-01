import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Button, Space, Typography, Drawer, Menu } from 'antd';
import {
  MenuOutlined,
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
  UserSwitchOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
const { Header: AntHeader } = Layout;
const { Text } = Typography;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const menuItems = useMemo(() => {
    if (!user) return [];
    const allMenuItems = [
      { key: 'my-workspace', icon: <AppstoreOutlined />, label: 'My Workspace', roles: ['employee', 'manager', 'hr', 'super-admin'], children: [
        { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile" onClick={() => setDrawerOpen(false)}>My Profile</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        { key: '/directory', icon: <TeamOutlined />, label: <Link to="/directory" onClick={() => setDrawerOpen(false)}>Directory</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        { key: '/leave', icon: <CalendarOutlined />, label: <Link to="/leave" onClick={() => setDrawerOpen(false)}>My Leave</Link>, roles: ['employee', 'manager', 'hr'] },
        { key: '/expenses', icon: <DollarOutlined />, label: <Link to="/expenses" onClick={() => setDrawerOpen(false)}>My Expenses</Link>, roles: ['employee', 'manager', 'hr'] },
        { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks" onClick={() => setDrawerOpen(false)}>My Tasks</Link>, roles: ['employee'] },
        { key: '/performance', icon: <SolutionOutlined />, label: <Link to="/performance" onClick={() => setDrawerOpen(false)}>Performance</Link>, roles: ['employee', 'manager'] },
        { key: '/attendance', icon: <ClockCircleOutlined />, label: <Link to="/attendance" onClick={() => setDrawerOpen(false)}>My Attendance</Link>, roles: ['employee', 'manager', 'hr'] },
        { key: '/surveys', icon: <QuestionCircleOutlined />, label: <Link to="/surveys" onClick={() => setDrawerOpen(false)}>My Surveys</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        { key: '/documents', icon: <FolderOpenOutlined />, label: <Link to="/documents" onClick={() => setDrawerOpen(false)}>Documents</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
      ]},
      { key: '/jobs', icon: <ReadOutlined />, label: <Link to="/jobs" onClick={() => setDrawerOpen(false)}>Job Openings</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
      { key: 'management', icon: <TeamOutlined />, label: 'Management', roles: ['manager', 'hr', 'super-admin'], children: [
        { key: '/team', icon: <TeamOutlined />, label: <Link to="/team" onClick={() => setDrawerOpen(false)}>My Team</Link> },
        { key: '/tasks-mgmt', icon: <CheckSquareOutlined />, label: <Link to="/tasks" onClick={() => setDrawerOpen(false)}>Task Management</Link> },
        { key: '/expenses/approvals', icon: <DollarOutlined />, label: <Link to="/expenses/approvals" onClick={() => setDrawerOpen(false)}>{(user.role === 'hr' || user.role === 'super-admin') ? 'Global Expense' : 'Team Expenses'}</Link> },
        { key: '/team/attendance', icon: <ClockCircleOutlined />, label: <Link to="/team/attendance" onClick={() => setDrawerOpen(false)}>Team Attendance</Link>, roles: ['manager', 'hr', 'super-admin'] },
      ]},
      { key: 'administration', icon: <SettingOutlined />, label: 'Administration', roles: ['hr', 'super-admin'], children: [
        { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/reports&analytics" onClick={() => setDrawerOpen(false)}>Reports&Analytics</Link> },
        { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users" onClick={() => setDrawerOpen(false)}>User Management</Link> },
        { key: '/admin/org-chart-editor', icon: <NodeIndexOutlined />, label: <Link to="/admin/org-chart-editor" onClick={() => setDrawerOpen(false)}>Org Chart Editor</Link> },
        { key: '/admin/departments', icon: <ApartmentOutlined />, label: <Link to="/admin/departments" onClick={() => setDrawerOpen(false)}>Departments</Link> },
        { key: '/admin/announcements', icon: <NotificationOutlined />, label: <Link to="/admin/announcements" onClick={() => setDrawerOpen(false)}>Announcements</Link> },
        { key: '/admin/performance', icon: <SolutionOutlined />, label: <Link to="/admin/performance" onClick={() => setDrawerOpen(false)}>Performance Cycles</Link>, roles: ['hr', 'super-admin'] },
        { key: '/admin/skills', icon: <BulbOutlined />, label: <Link to="/admin/skills" onClick={() => setDrawerOpen(false)}>Skill Library</Link> },
        { key: '/admin/roles', icon: <UserSwitchOutlined />, label: <Link to="/admin/roles" onClick={() => setDrawerOpen(false)}>Role Management</Link>, roles: ['super-admin'] },
        { key: '/admin/settings', icon: <ToolOutlined />, label: <Link to="/admin/settings" onClick={() => setDrawerOpen(false)}>System Settings</Link>, roles: ['super-admin'] },
      ]},
      { key: 'hr-modules', icon: <FileDoneOutlined />, label: 'HR Modules', roles: ['hr', 'super-admin'], children: [
        { key: '/admin/leaves', icon: <CalendarOutlined />, label: <Link to="/admin/leaves" onClick={() => setDrawerOpen(false)}>Leave Admin</Link> },
        { key: '/admin/leave-policies', icon: <BookOutlined />, label: <Link to="/admin/leave-policies" onClick={() => setDrawerOpen(false)}>Leave Policies</Link> },
        { key: '/admin/assets', icon: <HddOutlined />, label: <Link to="/admin/assets" onClick={() => setDrawerOpen(false)}>Asset Management</Link> },
        { key: '/admin/checklist-templates', icon: <FileDoneOutlined />, label: <Link to="/admin/checklist-templates" onClick={() => setDrawerOpen(false)}>Checklist Templates</Link> },
        { key: '/admin/surveys', icon: <BarChartOutlined />, label: <Link to="/admin/surveys" onClick={() => setDrawerOpen(false)}>Surveys</Link> },
        { key: '/admin/documents', icon: <BookOutlined />, label: <Link to="/admin/documents" onClick={() => setDrawerOpen(false)}>Documents</Link> },
      ]},
      { key: 'recruiting', icon: <ReadOutlined />, label: 'Recruiting', roles: ['hr', 'super-admin'], children: [
        { key: '/admin/jobs', icon: <ReadOutlined />, label: <Link to="/admin/jobs" onClick={() => setDrawerOpen(false)}>Manage Jobs</Link> },
        { key: '/admin/referrals', icon: <TeamOutlined />, label: <Link to="/admin/referrals" onClick={() => setDrawerOpen(false)}>View Referrals</Link> },
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

  const getOpenKeys = () => {
    const keyMap = {};
    const traverse = (items) => {
      items.forEach(item => {
        if (item.children) {
          item.children.forEach(child => { keyMap[child.key] = item.key; });
          traverse(item.children);
        }
      });
    };
    traverse(menuItems);
    const parentKey = keyMap[location.pathname];
    return parentKey ? [parentKey] : [];
  };

  return (
    <>
      <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        {user && (
          <Space size="large">
            {isMobile && (
              <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />
            )}
            <NotificationBell />
            <Text>Welcome, {user.name}!</Text>
            <Button type="primary" danger onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        )}
      </AntHeader>

      <Drawer
        title="Orion"
        placement="left"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={280}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          onClick={() => setDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
};

export default Header;