import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Fetches a list of all users in the system.
 */
export const fetchAllUsers = createAsyncThunk(
  'admin/fetchAllUsers',
  async ({ page, limit, sortBy, order, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sortBy', sortBy);
      params.append('order', order);

      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const { data } = await api.get(`/users?${params.toString()}`);
      return data; // Returns the full object { data: [...], pagination: {...} }
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
  async (userData, { rejectWithValue }) => {
    try {
      // The backend returns the new user object. We return it as the payload.
      const { data } = await api.post('/users', userData);
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
  async ({ userId, userData }, { rejectWithValue }) => {
    try {
      // The backend returns the updated user. We return it as the payload.
      const { data } = await api.put(`/users/${userId}`, userData);
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
  async (userId, { rejectWithValue }) => {
    try {
      // The backend now returns the ID of the deactivated user. We return it.
      const { data } = await api.delete(`/users/${userId}`);
      return data.data.deactivatedUserId;
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
/**
 * @desc    Fetch sensitive data for a specific user.
 * @access  Admin
 */
export const fetchSensitiveData = createAsyncThunk(
  'admin/fetchSensitiveData',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/sensitive-data/${userId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

/**
 * @desc    Update sensitive data for a specific user.
 * @access  Admin
 */
export const updateSensitiveData = createAsyncThunk(
  'admin/updateSensitiveData',
  async ({ userId, sensitiveData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/sensitive-data/${userId}`, sensitiveData);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

/**
 * @desc    Fetches the list of users the current user is permitted to chat with.
 *          This is a secure endpoint that applies business rules on the backend.
 * @route   GET /api/directory/chat-directory
 */
export const fetchChatDirectory = createAsyncThunk(
  'admin/fetchChatDirectory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/directory/chat-directory');
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch directory';
      return rejectWithValue(message);
    }
  }
);