import { createSlice } from '@reduxjs/toolkit';
import { loginUser, getMe, updateProfile, updateProfilePicture, } from './authThunks'; 
import api from '../../services/api';

const initialState = {
  user: null,
  token: localStorage.getItem('accessToken') || null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('accessToken');
      delete api.defaults.headers.common['Authorization'];
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    tokenRefreshed: (state, action) => {
        state.token = action.payload;
    },
    // The old profilePictureUpdated reducer has been removed from here.
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => { state.token = action.payload.accessToken; })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.token = null;
      })
      // GetMe (Profile fetch) cases
      .addCase(getMe.pending, (state) => { state.status = 'loading'; })
      .addCase(getMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        localStorage.removeItem('accessToken');
        state.user = null;
        state.token = null;
      })
      // UpdateProfile cases (for editing text details)
      .addCase(updateProfile.pending, (state) => { state.status = 'loading'; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // --- THIS IS THE NEW, CORRECT WAY TO HANDLE THE PICTURE UPDATE ---
      // It listens for the thunk to be fulfilled and updates the state.
      .addCase(updateProfilePicture.pending, (state) => { state.status = 'loading'; })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.user) {
          state.user.profilePictureUrl = action.payload; // action.payload is the filePath
        }
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout,tokenRefreshed } = authSlice.actions;
export default authSlice.reducer;