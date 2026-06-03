import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// To get the user's status for the dashboard widget
export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance/my-records');
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch attendance'); }
  }
);

export const fetchMyAttendanceSummary = createAsyncThunk(
  'attendance/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance/my-summary');
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch summary'); }
  }
);

export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-in');
      await dispatch(fetchMyAttendance());
      return data;
    } catch (error) { return rejectWithValue(error.response?.data?.message || error.message || 'Clock-in failed'); }
  }
);

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-out');
      await dispatch(fetchMyAttendance());
      return data;
    } catch (error) { return rejectWithValue(error.response?.data?.message || error.message || 'Clock-out failed'); }
  }
);

export const fetchTeamAttendance = createAsyncThunk(
  'attendance/fetchTeam',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance/team-records');
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch team attendance'); }
  }
);