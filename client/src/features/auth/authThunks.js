import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorExtractor';

/**
 * @desc    Logs a user in and fetches their profile.
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, twoFactorCode }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password, twoFactorCode });

      if (data.twoFactorRequired) {
        return { twoFactorRequired: true };
      }
      
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        await dispatch(getMe());
        
        return { loginSuccess: true };
      }

      return rejectWithValue('Invalid server response during login.');
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
      return rejectWithValue(extractErrorMessage(error));
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
      return rejectWithValue(extractErrorMessage(error));
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
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * @desc    Generate a new 2FA secret and QR code.
 */
export const generate2FASecret = createAsyncThunk(
  'auth/2fa/generate',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/2fa/generate');
      return data.data; // This will return { qrCode, secret }
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * @desc    Verify the 2FA code and enable 2FA on the user's account.
 */
export const verify2FACode = createAsyncThunk(
  'auth/2fa/verify',
  async (code, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/auth/2fa/verify', { code });
      // After successfully enabling, re-fetch the user profile to get the updated 2FA status
      dispatch(getMe());
      return true; // Indicate success
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);

/**
 * @desc    Disable 2FA on the user's account.
 */
export const disable2FA = createAsyncThunk(
  'auth/2fa/disable',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/auth/2fa/disable');
      dispatch(getMe()); // Re-fetch user profile to update status
      return true; // Indicate success
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
    }
  }
);