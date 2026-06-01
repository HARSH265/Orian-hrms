import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useSocket } from '../../context/SocketContext';
import { addMessage } from '../../features/chat/chatSlice';

const MessageInput = () => {
  const [text, setText] = useState('');
  const { socket } = useSocket();
  const dispatch = useDispatch();
  const { activeConversationId } = useSelector((state) => state.chat);
  const { user: loggedInUser } = useSelector((state) => state.auth);

  const handleSendMessage = () => {
    if (!text.trim() || !socket || !activeConversationId) return;

    const messageData = {
      conversationId: activeConversationId,
      text: text,
    };
    
    // 1. Emit the message to the server via Socket.IO
    socket.emit('sendMessage', messageData);

    // 2. Optimistically update our own UI
    // The backend will broadcast this to the other user, but not back to us.
    const optimisticMessage = {
        _id: Date.now(), // Temporary ID for the key
        conversationId: activeConversationId,
        sender: { // This needs to be a populated object
            _id: loggedInUser._id,
            name: loggedInUser.name,
            profilePictureUrl: loggedInUser.profilePictureUrl,
        },
        text: text,
        createdAt: new Date().toISOString(),
    };
    dispatch(addMessage({ conversationId: activeConversationId, message: optimisticMessage }));
    
    setText(''); // Clear the input
  };

  return (
    <div style={{ padding: '10px', borderTop: '1px solid #f0f0f0', display: 'flex' }}>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPressEnter={handleSendMessage}
        placeholder="Type a message..."
        autoComplete="off"
      />
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSendMessage}
        style={{ marginLeft: '8px' }}
      />
    </div>
  );
};

export default MessageInput;