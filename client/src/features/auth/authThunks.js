import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

/**
 * @desc    Logs a user in and fetches their profile.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('accessToken', data.accessToken);
      if (data.accessToken) {
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
      }
      await dispatch(getMe());
      return data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Fetches the currently logged-in user's full profile.
 */
export const getMe = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/users/profile');
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

/**
 * @desc    Updates user's text-based profile info (phone, address).
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      await api.put('/users/profile', userData);
      const resultAction = await dispatch(getMe()); // Re-fetch full profile for consistency
      if (getMe.fulfilled.match(resultAction)) {
        return resultAction.payload;
      } else {
        return rejectWithValue(resultAction.payload);
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

/**
 * @desc    Marks the welcome wizard as complete.
 */
export const completeWelcomeWizard = createAsyncThunk(
  'auth/completeWizard',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await api.put('/users/complete-wizard');
      dispatch(getMe());
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

/**
 * @desc    Specialized thunk to update only the profile picture.
 */
export const updateProfilePicture = createAsyncThunk(
  'auth/updateProfilePicture',
  async (filePath, { rejectWithValue }) => {
    try {
      const userData = { profilePictureUrl: filePath };
      // 1. Make the API call to save the new URL to the database.
      await api.put('/users/profile', userData);
      
      // 2. On success, simply return the new file path.
      //    The slice's extraReducer will handle updating the state with this value.
      return filePath;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);