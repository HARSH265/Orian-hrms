import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchMyNotifications = createAsyncThunk(
  'notification/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/notifications');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      // --- CHANGE: The API call now returns the updated notification ---
      const { data } = await api.put(`/notifications/${notificationId}/read`);
      // Return the updated notification object as the payload
      return data.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);