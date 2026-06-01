import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Layout } from 'antd';
import { getConversations } from '../features/chat/chatThunks';
import ConversationList from '../components/chat/ConversationList';
import ChatWindow from '../components/chat/ChatWindow';

const { Sider, Content } = Layout;

const ChatPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Fetch the user's conversation list when the page loads
    dispatch(getConversations());
  }, [dispatch]);

  return (
    <Layout style={{ height: 'calc(100vh - 160px)' }}> {/* Adjust height as needed */}
      <Sider width={300} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
        <ConversationList />
      </Sider>
      <Layout>
        <Content style={{ background: '#fff' }}>
          <ChatWindow />
        </Content>
      </Layout>
    </Layout>
  );
};

export default ChatPage;