import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { List, Avatar, Typography, Spin } from 'antd';
import './MessageList.css'; // For custom message styling

const { Text } = Typography;

const MessageList = () => {
  const { messages, activeConversationId, status } = useSelector((state) => state.chat);
  const { user: loggedInUser } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null); // Ref to the end of the list

  const activeMessages = messages[activeConversationId] || [];

  // Function to scroll to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]); // Scroll whenever new messages are added

  if (status === 'loading' && activeMessages.length === 0) {
    return <Spin style={{ margin: 'auto' }} />;
  }

  return (
    <div className="message-list-container">
      <List
        dataSource={activeMessages}
        renderItem={(message) => {
          const isMe = message.sender._id === loggedInUser._id;
          return (
            <List.Item className={`message-item ${isMe ? 'sent' : 'received'}`}>
              <div className="message-bubble">
                {!isMe && (
                   <Text strong className="message-sender">{message.sender.name}</Text>
                )}
                <Text>{message.text}</Text>
                <div className="message-timestamp">
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </List.Item>
          );
        }}
      />
      <div ref={messagesEndRef} /> {/* Dummy div at the end to scroll to */}
    </div>
  );
};

export default MessageList;