import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// --- THIS IS THE FIX: Added 'Button' to the import list ---
import { List, Avatar, Typography, Spin, Empty, Button } from 'antd'; 
import { CloseOutlined } from '@ant-design/icons';
import { getConversations, getMessages,markConversationAsRead } from '../../features/chat/chatThunks';
import { setActiveConversation } from '../../features/chat/chatSlice';
import './ConversationList.css';

const { Text } = Typography;

const ConversationList = ({ onClose }) => {
  const dispatch = useDispatch();
  const { conversations, status, activeConversationId } = useSelector((state) => state.chat);
  const { user: loggedInUser } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(getConversations());
    }
  }, [status, dispatch]);

  const handleConversationClick = (conversationId) => {
    dispatch(setActiveConversation(conversationId));
    dispatch(getMessages(conversationId));
    dispatch(markConversationAsRead(conversationId));
  };

  if (status === 'loading') {
    return <Spin style={{ display: 'block', margin: '20px auto' }} />;
  }

  return (
    <div className="conversation-list-container">
      <div className="conversation-list-header">
        <Text strong>Conversations</Text>
        <Button
          type="text"
          shape="circle"
          icon={<CloseOutlined />}
          onClick={onClose}
          aria-label="Close chat"
        />
      </div>
      {conversations.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={conversations}
          renderItem={(convo) => {
            const otherParticipant = convo.participants.find(p => p._id !== loggedInUser._id);
            if (!otherParticipant) return null;

            return (
              <List.Item
                onClick={() => handleConversationClick(convo._id)}
                className={`conversation-item ${convo._id === activeConversationId ? 'active' : ''}`}
              >
                <List.Item.Meta
                  avatar={<Avatar src={otherParticipant.profilePictureUrl} />}
                  title={<Text strong>{otherParticipant.name}</Text>}
                  description={<Text type="secondary" ellipsis>{convo.lastMessage?.text || 'No messages yet'}</Text>}
                />
              </List.Item>
            );
          }}
        />
      ) : (
        <Empty description="No conversations found." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default ConversationList;