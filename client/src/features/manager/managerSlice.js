import { createSlice } from '@reduxjs/toolkit';
import { fetchTeamLeaveRequests, updateTeamLeaveRequest, fetchMyTeam } from './managerThunks';

const initialState = {
  teamLeaveRequests: [],
  myTeam: [], 
  status: 'idle',
  error: null,
};

const managerSlice = createSlice({
  name: 'manager',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching team leave requests
      .addCase(fetchTeamLeaveRequests.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTeamLeaveRequests.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teamLeaveRequests = action.payload;
      })
      .addCase(fetchTeamLeaveRequests.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for updating a request
      .addCase(updateTeamLeaveRequest.pending, (state) => {
        // We could set a specific 'updating' status if we wanted finer control
        state.status = 'loading';
      })
      .addCase(updateTeamLeaveRequest.fulfilled, (state) => {
        // The list is re-fetched by the thunk, so the status is just set back to succeeded.
        // The fetchTeamLeaveRequests.fulfilled reducer will handle updating the data.
        state.status = 'succeeded';
      })
      .addCase(updateTeamLeaveRequest.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
       
      // --- ADD THESE NEW CASES ---
      .addCase(fetchMyTeam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMyTeam.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myTeam = action.payload;
      })
      .addCase(fetchMyTeam.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default managerSlice.reducer;