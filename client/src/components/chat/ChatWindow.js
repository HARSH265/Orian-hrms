import React from 'react';
import { useSelector } from 'react-redux';
import { Layout, Empty, Typography } from 'antd';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const { Header, Content } = Layout;
const { Text } = Typography;

const ChatWindow = () => {
  const { activeConversationId, conversations } = useSelector((state) => state.chat);
  const { user: loggedInUser } = useSelector((state) => state.auth);

  if (!activeConversationId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Empty description="Select a conversation to start chatting" />
      </div>
    );
  }

  // Find the full conversation object to get participant details
  const activeConversation = conversations.find(c => c._id === activeConversationId);
  if (!activeConversation) return null; // Or show an error state

  const otherParticipant = activeConversation.participants.find(p => p._id !== loggedInUser._id);

  return (
    <Layout style={{ height: '100%' }}>
      <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 16px', display: 'flex', alignItems: 'center' }}>
        <Text strong>{otherParticipant?.name || 'Chat'}</Text>
      </Header>
      <Content style={{ display: 'flex', flexDirection: 'column' }}>
        <MessageList />
        <MessageInput />
      </Content>
    </Layout>
  );
};

export default ChatWindow;