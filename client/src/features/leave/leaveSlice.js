import { createSlice } from '@reduxjs/toolkit';
import { fetchMyLeaveHistory, applyForLeave, withdrawLeave } from './leaveThunks';

const initialState = {
  leaves: [], // This will hold the array of leave objects
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {}, // No direct reducers needed for now
  extraReducers: (builder) => {
    builder
      // Cases for fetching history
      .addCase(fetchMyLeaveHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyLeaveHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leaves = action.payload; // Replace the list with the fetched data
      })
      .addCase(fetchMyLeaveHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for applying for leave
      .addCase(applyForLeave.pending, (state) => {
        state.status = 'loading'; // We can show a loading state on the submit button
      })
      .addCase(applyForLeave.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Add the new leave request to the top of our list for immediate feedback
        // Note: The thunk already re-fetches, so this is for optimistic UI, but let's rely on the fetch.
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload; // We can show this error message to the user
      })
      .addCase(withdrawLeave.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(withdrawLeave.fulfilled, (state) => {
        // The list is re-fetched, so we just reset the status.
        state.status = 'succeeded';
      })
      .addCase(withdrawLeave.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default leaveSlice.reducer;