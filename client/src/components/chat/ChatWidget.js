import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Layout, FloatButton  } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import './ChatWidget.css'; // We will create this for styling

const { Sider, Content } = Layout;

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeConversationId } = useSelector((state) => state.chat);
  const unreadCount = 0; // We'll add logic for this later

  const toggleChat = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <FloatButton
        icon={<MessageOutlined />}
        badge={{ count: unreadCount, overflowCount: 9 }}
        tooltip="Open Chat"
        onClick={toggleChat}
        size="large"
      />
    );
  }

  return (
     <div className="chat-widget-container">
      <Layout className="chat-widget-layout">
        <Sider width={280} className="chat-widget-sider">
          {/* --- PASS THE toggleChat FUNCTION AS THE onClose PROP --- */}
          <ConversationList onClose={toggleChat} />
        </Sider>
        <Layout>
          <Content className="chat-widget-content">
            <ChatWindow />
          </Content>
        </Layout>
      </Layout>
      {/* --- REMOVE THE OLD, SEPARATE CLOSE BUTTON --- */}
      {/* The FloatButton that was here is now deleted */}
    </div>
  );
};

export default ChatWidget;