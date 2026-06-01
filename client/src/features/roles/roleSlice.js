// In: client/src/features/roles/roleSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchRoles, createRole, updateRole, deleteRole } from './roleThunks';

const initialState = { roles: [], status: 'idle', error: null };

const roleSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // --- NEW: Optimistic Updates ---
      .addCase(createRole.fulfilled, (state, action) => {
          state.roles.unshift(action.payload);
          state.status = 'succeeded';
      })
      .addCase(updateRole.fulfilled, (state, action) => {
          const index = state.roles.findIndex(r => r._id === action.payload._id);
          if (index !== -1) {
              state.roles[index] = action.payload;
          }
          state.status = 'succeeded';
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
          state.roles = state.roles.filter(r => r._id !== action.payload);
          state.status = 'succeeded';
      })

      // Matchers for generic pending/rejected states
      .addMatcher(
        (action) => [createRole.pending, updateRole.pending, deleteRole.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createRole.rejected, updateRole.rejected, deleteRole.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  }
});

export default roleSlice.reducer;