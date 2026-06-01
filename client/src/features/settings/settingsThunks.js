import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Fetch the current system settings
export const fetchSettings = createAsyncThunk(
  'settings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/settings');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Update the system settings
export const updateSettings = createAsyncThunk(
  'settings/update',
  async (settingsData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put('/settings', settingsData);
      // No need to re-fetch, the PUT request already returns the updated settings
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);