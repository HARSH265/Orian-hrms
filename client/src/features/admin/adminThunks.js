import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Fetches a list of all users in the system.
 */
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users');
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Creates a new user.
 * @param   {object} userData - The new user's data from the form.
 */
export const createNewUser = createAsyncThunk(
  'admin/createNewUser',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/users', userData);
      dispatch(fetchAllUsers()); // Refresh the main user list
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Updates a user's details by their ID.
 * @param   {object} { userId, userData } - The ID of the user and the data to update.
 */
export const updateUser = createAsyncThunk(
  'admin/updateUser',
  async ({ userId, userData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/users/${userId}`, userData);
      dispatch(fetchAllUsers()); // Refresh the main user list
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Deactivates a user by their ID (soft delete).
 * @param   {string} userId - The ID of the user to deactivate.
 */
export const deactivateUser = createAsyncThunk(
  'admin/deactivateUser',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/users/${userId}`);
      dispatch(fetchAllUsers()); // Refresh the main user list
      return userId;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Fetches a list of all users with a manager-level role ('manager', 'hr', 'super-admin').
 *          This is a self-sufficient thunk that calls its own dedicated API endpoint.
 */
export const fetchAllManagers = createAsyncThunk(
  'admin/fetchAllManagers',
  async (_, { rejectWithValue }) => {
    try {
      // Calls our new, dedicated backend endpoint
      const { data } = await api.get('/users/managers');
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);