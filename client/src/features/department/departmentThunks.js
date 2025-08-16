import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAllDepartments = createAsyncThunk(
  'department/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/departments');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'department/create',
  async (departmentData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/departments', departmentData);
      dispatch(fetchAllDepartments()); // Re-fetch list after creation
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'department/update',
  async ({ departmentId, departmentData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/departments/${departmentId}`, departmentData);
      dispatch(fetchAllDepartments()); // Re-fetch list after update
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'department/delete',
  async (departmentId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/departments/${departmentId}`);
      dispatch(fetchAllDepartments()); // Re-fetch list after deletion
      return departmentId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
    }
  }
);