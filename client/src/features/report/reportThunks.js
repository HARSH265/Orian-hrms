import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchLeaveByDepartment = createAsyncThunk(
  'report/fetchLeaveByDept',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/reports/leave-by-department');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchExpensesByCategory = createAsyncThunk(
  'report/fetchExpensesByCat',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/reports/expenses-by-category');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);