import { createSlice } from '@reduxjs/toolkit';
import { fetchDirectoryUsers, fetchOrgChartData, fetchAllUsers } from './directoryThunks';

const initialState = {
  users: [],
  allUsers: [],
  orgChartData: [],
  status: 'idle',
  error: null,
};

const directorySlice = createSlice({
  name: 'directory',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectoryUsers.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchDirectoryUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchDirectoryUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchOrgChartData.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchOrgChartData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orgChartData = action.payload;
      })
      .addCase(fetchOrgChartData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default directorySlice.reducer;