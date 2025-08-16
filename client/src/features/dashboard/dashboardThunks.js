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