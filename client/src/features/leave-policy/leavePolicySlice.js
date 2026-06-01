import { createSlice } from '@reduxjs/toolkit';
import { fetchLeavePolicies, fetchMyLeaveBalances } from './leavePolicyThunks';

const initialState = {
  policies: [],
  myBalances: [],
  status: 'idle',
  error: null,
};

const leavePolicySlice = createSlice({
  name: 'leavePolicy',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching all policies
      .addCase(fetchLeavePolicies.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchLeavePolicies.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.policies = action.payload;
      })
      .addCase(fetchLeavePolicies.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for fetching an employee's personal balances
      .addCase(fetchMyLeaveBalances.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyLeaveBalances.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myBalances = action.payload;
      })
      .addCase(fetchMyLeaveBalances.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default leavePolicySlice.reducer;