import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchDirectoryUsers = createAsyncThunk(
  'directory/fetchUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/directory/users');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchOrgChartData = createAsyncThunk(
  'directory/fetchOrgChart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/directory/org-chart');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- ADD THIS NEW THUNK TO THE FILE ---
export const fetchAllUsers = createAsyncThunk(
  'directory/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);