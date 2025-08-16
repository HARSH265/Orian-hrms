import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom'; // Outlet is the key to this pattern
import Sidebar from './Sidebar';
import Header from './Header';

const { Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {/* Outlet will render the matched child route (e.g., DashboardPage, ProfilePage) */}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;