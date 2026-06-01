// In: client/src/features/dashboard/dashboardThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDataHealth = createAsyncThunk(
  'dashboard/fetchDataHealth',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/dashboard/data-health');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- NEW: Thunk for Task Metrics ---
export const fetchTaskMetrics = createAsyncThunk(
  'dashboard/fetchTaskMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/dashboard/task-metrics');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- NEW: Thunk for Leave Metrics ---
export const fetchLeaveMetrics = createAsyncThunk(
  'dashboard/fetchLeaveMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/dashboard/leave-metrics');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);