import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

import { setUnreadCount } from './chatSlice';

// Fetches all of the user's conversations (the contact list)
export const getConversations = createAsyncThunk(
  'chat/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/conversations');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

// Fetches the message history for a single, selected conversation
export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      return { conversationId, messages: response.data.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Finds or creates a 1-on-1 conversation with another user
export const findOrCreateConversation = createAsyncThunk(
  'chat/findOrCreateConversation',
  async (recipientId, { rejectWithValue }) => {
    try {
      const response = await api.post('/chat/conversations', { recipientId });
      return response.data.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to start conversation');
    }
  }
);

/**
 * @desc    Tells the backend to mark all messages in a conversation as read.
 *          The backend will respond with the new total unread count for the user.
 */
export const markConversationAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (conversationId, { dispatch, rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/read`);
      
      // The backend responds with the new total unread count.
      const newTotalUnreadCount = response.data.unreadCount;
      
      // Now we use dispatch to call the 'setUnreadCount' reducer from our slice
      // to update the number in our Redux state.
      dispatch(setUnreadCount(newTotalUnreadCount));
      
      return response.data; // Return the full response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);