import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Fetches all leave requests for the manager's team.
 */
export const fetchTeamLeaveRequests = createAsyncThunk(
  'manager/fetchTeamLeaveRequests',
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get('/manager/team-leave-requests');
      return data.data;
    } catch (error) {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * @desc    Updates the status and notes of a specific leave request.
 * @param   {object} payload - Contains { leaveId, status, managerNotes }.
 */
export const updateTeamLeaveRequest = createAsyncThunk(
  'manager/updateTeamLeaveRequest',
  // --- THE FIX: Destructure managerNotes from the payload ---
  async (payload, thunkAPI) => {
    try {
      const { leaveId, status, managerNotes } = payload;
      
      // --- THE FIX: Send both status and managerNotes in the request body ---
      const { data } = await api.put(`/manager/leave-request/${leaveId}`, { status, managerNotes });
      
      // After successfully updating, re-fetch the list to show the change.
      thunkAPI.dispatch(fetchTeamLeaveRequests());
      
      return data.data; // Return the updated leave object
    } catch (error)
     {
      const message =
        (error.response?.data?.message) || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);


/**
 * @desc    Fetches the list of a manager's direct reports.
 */
export const fetchMyTeam = createAsyncThunk(
  'manager/fetchMyTeam',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/manager/my-team');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);