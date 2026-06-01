// In: client/src/features/admin/adminSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchAllUsers, 
    createNewUser, 
    updateUser, 
    deactivateUser, 
    fetchAllManagers,  
    fetchSensitiveData,
    updateSensitiveData,
    fetchChatDirectory
} from './adminThunks';

const initialState = {
  users: [], 
  managers: [],
  pagination: {
    total: 0,
    page: 1,
    pages: 1,
  },
  status: 'idle',
  error: null,
  sensitiveData: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
     clearSensitiveData: (state) => {
      state.sensitiveData = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Cases for fetching all users (server-side pagination)
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // Chat Directory cases
      .addCase(fetchChatDirectory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchChatDirectory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload; 
      })
      .addCase(fetchChatDirectory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- NEW: Optimistic UI update logic ---
      .addCase(createNewUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add the new user to the start of the list for immediate visibility.
        // This assumes the list is sorted by creation date; otherwise, a re-fetch might be better.
        state.users.unshift(action.payload);
        state.pagination.total += 1; // Increment the total count
      })

      .addCase(updateUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const updatedUser = action.payload;
        // Find the index of the user in the list and replace them.
        const index = state.users.findIndex(user => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      
      .addCase(deactivateUser.fulfilled, (state, action) => {
          state.status = 'succeeded';
          const deactivatedUserId = action.payload;
          // Filter the user out of the list if the current filter is 'active'.
          // If viewing 'inactive', a re-fetch would be needed to see them.
          // For simplicity, we remove from the current view.
          state.users = state.users.filter(user => user._id !== deactivatedUserId);
          state.pagination.total -= 1;
      })

          // Cases for fetching managers (no change)

      .addCase(fetchAllManagers.fulfilled, (state, action) => {
        state.managers = action.payload;
      })

      // Cases for sensitive data (no change)
      .addCase(fetchSensitiveData.pending, (state) => {
        state.status = 'loading';
        state.sensitiveData = null;
      })
      .addCase(fetchSensitiveData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sensitiveData = action.payload;
      })
      .addCase(fetchSensitiveData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateSensitiveData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateSensitiveData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.sensitiveData = action.payload;
      })
      .addCase(updateSensitiveData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Matchers for generic pending/rejected states for mutations ---
      .addMatcher(
        (action) => [createNewUser.pending, updateUser.pending, deactivateUser.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createNewUser.rejected, updateUser.rejected, deactivateUser.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
      
  },
});

export const { clearSensitiveData } = adminSlice.actions;
export default adminSlice.reducer;