// In: client/src/features/auth/authSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { loginUser, getMe, updateProfile, updateProfilePicture, generate2FASecret, verify2FACode } from './authThunks'; 
import { addSkillToProfile, removeSkillFromProfile } from '../skill/skillThunks';
import api from '../../services/api';

const initialState = {
  user: null,
  token: localStorage.getItem('accessToken') || null,
  status: 'idle',
  error: null,
  tokenExpiresAt: null,
  tokenExpiryWarning: false,
  twoFactorSetup: {
    qrCode: null,
    secret: null,
    status: 'idle',
    error: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
     logout: (state) => {
       localStorage.removeItem('accessToken');
       delete api.defaults.headers.common['Authorization'];
       document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
       state.user = null;
       state.token = null;
       state.tokenExpiresAt = null;
       state.tokenExpiryWarning = false;
       state.status = 'idle';
       state.error = null;
       state.twoFactorSetup = initialState.twoFactorSetup;
     },
    // =======================================================================
    // --- THE FIX: This reducer must also update localStorage ---
  tokenRefreshed: (state, action) => {
      state.token = action.payload;
      localStorage.setItem('accessToken', action.payload);
    },
    // =======================================================================
    clear2FASetup: (state) => {
        state.twoFactorSetup = initialState.twoFactorSetup;
    },
    setTokenExpiry: (state, action) => {
        state.tokenExpiresAt = action.payload;
        state.tokenExpiryWarning = false;
    },
    tokenExpiryWarning: (state) => {
        state.tokenExpiryWarning = true;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => { 
        state.status = 'loading'; 
        state.error = null; 
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        if (action.payload?.twoFactorRequired) {
            state.status = 'idle';
        } else if (action.payload?.loginSuccess) {
            state.status = 'succeeded';
            // This logic is correct. The `loginUser` thunk sets localStorage,
            // and this reducer reads from it.
            state.token = localStorage.getItem('accessToken');
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.tokenExpiresAt = null;
        state.tokenExpiryWarning = false;
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
        // The `logout` action should be dispatched from the interceptor on a 401
        // This logic here can be a failsafe.
        localStorage.removeItem('accessToken');
        state.user = null;
        state.token = null;
        state.tokenExpiresAt = null;
        state.tokenExpiryWarning = false;
      })
      // UpdateProfile cases
      .addCase(updateProfile.pending, (state) => { state.status = 'loading'; })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update Profile Picture cases
      .addCase(updateProfilePicture.pending, (state) => { state.status = 'loading'; })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (state.user) {
          state.user.profilePictureUrl = action.payload;
        }
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Skills cases
      .addCase(addSkillToProfile.fulfilled, (state, action) => {
          if (state.user) {
              state.user.skills = action.payload;
          }
      })
      .addCase(removeSkillFromProfile.fulfilled, (state, action) => {
          if (state.user) {
              state.user.skills = action.payload;
          }
      })
      // 2FA cases
      .addCase(generate2FASecret.pending, (state) => {
        state.twoFactorSetup.status = 'loading';
      })
      .addCase(generate2FASecret.fulfilled, (state, action) => {
        state.twoFactorSetup.status = 'succeeded';
        state.twoFactorSetup.qrCode = action.payload.qrCode;
        state.twoFactorSetup.secret = action.payload.secret;
        state.twoFactorSetup.error = null;
      })
      .addCase(generate2FASecret.rejected, (state, action) => {
        state.twoFactorSetup.status = 'failed';
        state.twoFactorSetup.error = action.payload;
      })
      .addCase(verify2FACode.pending, (state) => {
        state.twoFactorSetup.status = 'loading';
      })
      .addCase(verify2FACode.fulfilled, (state) => {
        state.twoFactorSetup = initialState.twoFactorSetup;
      })
      .addCase(verify2FACode.rejected, (state, action) => {
        state.twoFactorSetup.status = 'failed';
        state.twoFactorSetup.error = action.payload;
      });
  },
});

export const { logout, tokenRefreshed, clear2FASetup, setTokenExpiry, tokenExpiryWarning: setTokenExpiryWarning } = authSlice.actions;
export default authSlice.reducer;