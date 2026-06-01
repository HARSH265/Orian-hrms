import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom'; 
import { useDispatch } from 'react-redux'; 
import { useSocket } from '../context/SocketContext'; 
import { addMessage} from '../features/chat/chatSlice';

import Sidebar from './Sidebar';
import Header from './Header';
import ChatWidget from './chat/ChatWidget';

const { Content } = Layout;

const MainLayout = () => {
   const { socket } = useSocket();
  const dispatch = useDispatch();
  

  // --- START: Socket Event Listener ---
  useEffect(() => {
    if (!socket) return;

    // Listen for the 'newMessage' event from the server
    const handleNewMessage = (data) => {
      // When a new message arrives, dispatch the action to add it to the Redux store
      dispatch(addMessage(data));
    };

    socket.on('newMessage', handleNewMessage);

    // Clean up the listener when the component unmounts
    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, dispatch]);
  // --- END: Socket Event Listener ---

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', position: 'relative' }}>
          {/* Outlet will render the matched child route (e.g., DashboardPage, ProfilePage) */}
          <Outlet />
           <ChatWidget />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;