import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.message) return error.message;
  if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
  return 'An unexpected error occurred.';
};

/**
 * @desc    Fetches the leave history for the currently logged-in user.
 */
export const fetchMyLeaveHistory = createAsyncThunk(
  'leave/fetchMyHistory',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/leave/my-history');
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * @desc    Submits a new leave application for the current user.
 * @param   {object} leaveData - Contains { startDate, endDate, reason }.
 */
export const applyForLeave = createAsyncThunk(
  'leave/apply',
  async (leaveData, thunkAPI) => {
    try {
      const { data } = await api.post('/leave', leaveData);
      await thunkAPI.dispatch(fetchMyLeaveHistory());
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error));
    }
  }
);

/**
 * @desc    Withdraws a user's own pending leave request.
 * @param   {string} leaveId - The ID of the leave request to withdraw.
 */
export const withdrawLeave = createAsyncThunk(
  'leave/withdraw',
  async (leaveId, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/leave/${leaveId}/withdraw`);
      await dispatch(fetchMyLeaveHistory());
      return leaveId;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);