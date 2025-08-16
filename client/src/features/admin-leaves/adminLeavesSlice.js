import { createSlice } from '@reduxjs/toolkit';
import { fetchAllSystemLeaves, adminUpdateLeaveStatus } from './adminLeavesThunks';

const initialState = {
  allLeaves: [],
  status: 'idle',
  error: null,
};

const adminLeavesSlice = createSlice({
  name: 'adminLeaves',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching all leave requests
      .addCase(fetchAllSystemLeaves.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllSystemLeaves.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allLeaves = action.payload;
      })
      .addCase(fetchAllSystemLeaves.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for updating a request
      .addCase(adminUpdateLeaveStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(adminUpdateLeaveStatus.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(adminUpdateLeaveStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default adminLeavesSlice.reducer;