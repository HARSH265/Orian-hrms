import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Fetches ALL leave requests in the system.
 */
export const fetchAllSystemLeaves = createAsyncThunk(
  'adminLeaves/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // Backend endpoint is GET /api/admin/leave-requests
      const { data } = await api.get('/admin/leave-requests');
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || 'Failed to fetch leave requests';
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Admin action to update the status of any leave request.
 *          This reuses the manager's endpoint, which we upgraded.
 * @param   {object} { leaveId, status }
 */
export const adminUpdateLeaveStatus = createAsyncThunk(
  'adminLeaves/updateStatus',
  async ({ leaveId, status }, { dispatch, rejectWithValue }) => {
    try {
      // We reuse the manager's endpoint because our backend logic now allows admins.
      const { data } = await api.put(`/manager/leave-requests/${leaveId}`, { status });
      dispatch(fetchAllSystemLeaves()); // Refresh the list after the action.
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || 'Failed to update status';
      return rejectWithValue(message);
    }
  }
);