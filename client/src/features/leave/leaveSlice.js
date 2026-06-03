import { createSlice } from '@reduxjs/toolkit';
import { fetchMyLeaveHistory, applyForLeave, withdrawLeave } from './leaveThunks';

const initialState = {
  leaves: [],
  status: 'idle',
  error: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaveHistory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyLeaveHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leaves = action.payload;
      })
      .addCase(fetchMyLeaveHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(applyForLeave.pending, (state) => {
        state.error = null;
      })
      .addCase(applyForLeave.fulfilled, (state) => {
        // Re-fetch handles list update; just clear error
        state.error = null;
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(withdrawLeave.pending, (state) => {
        state.error = null;
      })
      .addCase(withdrawLeave.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(withdrawLeave.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = leaveSlice.actions;
export default leaveSlice.reducer;