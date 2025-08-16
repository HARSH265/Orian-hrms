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
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Sider } = Layout;

// Helper function to create a map of child keys to parent keys
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

  // useMemo ensures this complex logic only runs when the user object changes.
  const accessibleItems = useMemo(() => {
    if (!user) return [];

    // This is the full, static menu structure. Defined inside useMemo to access `user`.
    const allMenuItems = [
        { key: 'my-workspace', icon: <AppstoreOutlined />, label: 'My Workspace', roles: ['employee', 'manager', 'hr', 'super-admin'], children: [
            { key: '/profile', icon: <UserOutlined />, label: <Link to="/profile">My Profile</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
            { key: '/leave', icon: <CalendarOutlined />, label: <Link to="/leave">My Leave</Link>, roles: ['employee', 'manager', 'hr'] },
            { key: '/expenses', icon: <DollarOutlined />, label: <Link to="/expenses">My Expenses</Link>, roles: ['employee', 'manager', 'hr'] },
            { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks">My Tasks</Link>, roles: ['employee'] },
        ]},
        { key: '/jobs', icon: <ReadOutlined />, label: <Link to="/jobs">Job Openings</Link>, roles: ['employee', 'manager', 'hr', 'super-admin'] },
        { key: 'management', icon: <TeamOutlined />, label: 'Management', roles: ['manager', 'hr', 'super-admin'], children: [
            { key: '/team', icon: <TeamOutlined />, label: <Link to="/team">My Team</Link> },
            { key: '/tasks', icon: <CheckSquareOutlined />, label: <Link to="/tasks">Task Management</Link> },
            { key: '/expenses/approvals', icon: <DollarOutlined />, label: <Link to="/expenses/approvals">{(user.role === 'hr' || user.role === 'super-admin') ? 'Global Expense' : 'Team Expenses'}</Link> },
        ]},
        { key: 'administration', icon: <SettingOutlined />, label: 'Administration', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/dashboard', icon: <DashboardOutlined />, label: <Link to="/admin/dashboard">Admin Dashboard</Link> },
            { key: '/admin/users', icon: <UserOutlined />, label: <Link to="/admin/users">User Management</Link> },
            { key: '/admin/departments', icon: <ApartmentOutlined />, label: <Link to="/admin/departments">Departments</Link> },
            { key: '/admin/announcements', icon: <NotificationOutlined />, label: <Link to="/admin/announcements">Announcements</Link> },
        ]},
        { key: 'hr-modules', icon: <FileDoneOutlined />, label: 'HR Modules', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/leaves', icon: <CalendarOutlined />, label: <Link to="/admin/leaves">Leave Admin</Link> },
            { key: '/admin/assets', icon: <HddOutlined />, label: <Link to="/admin/assets">Asset Management</Link> },
            { key: '/admin/checklist-templates', icon: <FileDoneOutlined />, label: <Link to="/admin/checklist-templates">Checklist Templates</Link> },
        ]},
        { key: 'recruiting', icon: <ReadOutlined />, label: 'Recruiting', roles: ['hr', 'super-admin'], children: [
            { key: '/admin/jobs', icon: <ReadOutlined />, label: <Link to="/admin/jobs">Manage Jobs</Link> },
            { key: '/admin/referrals', icon: <TeamOutlined />, label: <Link to="/admin/referrals">View Referrals</Link> },
        ]}
    ];

    // This recursive function filters the menu based on roles. It's safe.
    const filterMenu = (items) => {
        return items
          .map(item => {
            if (item.roles && !item.roles.includes(user.role)) {
              return null;
            }
            if (item.children) {
              const filteredChildren = filterMenu(item.children);
              if (filteredChildren.length > 0) {
                return { ...item, children: filteredChildren };
              }
              return null;
            }
            return item;
          })
          .filter(Boolean);
    };
    
    return filterMenu(allMenuItems);
  }, [user]);

  // This is also memoized and now depends on the stable `accessibleItems`
  const parentKeysMap = useMemo(() => getParentKeysMap(accessibleItems), [accessibleItems]);

  // This effect correctly sets the open submenu on page navigation
  useEffect(() => {
    const parentKey = parentKeysMap[location.pathname];
    setOpenKeys(parentKey ? [parentKey] : []);
  }, [location.pathname, parentKeysMap]);

  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };
  
  return (
    <Sider collapsible theme="dark" breakpoint="lg" collapsedWidth="80">
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