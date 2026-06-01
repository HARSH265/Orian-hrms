import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// To get the user's status for the dashboard widget
export const fetchMyAttendance = createAsyncThunk(
  'attendance/fetchMy', // <-- Changed action type name for clarity
  async (_, { rejectWithValue }) => {
    try {
      // This endpoint correctly gets all recent records, so the name is appropriate
      const { data } = await api.get('/attendance/my-records');
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-in');
      dispatch(fetchMyAttendance()); // Refresh status after clocking in
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

export const clockOut = createAsyncThunk(
  'attendance/clockOut',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/attendance/clock-out');
      dispatch(fetchMyAttendance()); // Refresh status after clocking out
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

// For Manager's view
export const fetchTeamAttendance = createAsyncThunk(
  'attendance/fetchTeam',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/attendance/team-records');
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);