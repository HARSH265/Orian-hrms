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
  async (notificationId, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      // After marking as read, we can either re-fetch the list or update the state locally.
      // For simplicity, let's re-fetch.
      dispatch(fetchMyNotifications());
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);