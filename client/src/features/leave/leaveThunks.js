import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Fetches the leave history for the currently logged-in user.
 */
export const fetchMyLeaveHistory = createAsyncThunk(
  'leave/fetchMyHistory',
  async (_, thunkAPI) => {
    try {
      // The backend endpoint is GET /api/leave/my-history
      const { data } = await api.get('/leave/my-history');
      return data.data; // The backend wraps the array in a 'data' property
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
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
      // The backend endpoint is POST /api/leave
      const { data } = await api.post('/leave', leaveData);
      thunkAPI.dispatch(fetchMyLeaveHistory()); // Optional: re-fetch the whole list for consistency
      return data.data; // Return the newly created leave object
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ... at the end of the file ...

/**
 * @desc    Withdraws a user's own pending leave request.
 * @param   {string} leaveId - The ID of the leave request to withdraw.
 */
export const withdrawLeave = createAsyncThunk(
  'leave/withdraw',
  async (leaveId, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/leave/${leaveId}/withdraw`);
      dispatch(fetchMyLeaveHistory()); // Re-fetch the list to show the change
      return leaveId;
    } catch (error) {
      const message = (error.response?.data?.message) || 'Failed to withdraw request';
      return rejectWithValue(message);
    }
  }
);