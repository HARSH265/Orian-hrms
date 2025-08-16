import { createSlice } from '@reduxjs/toolkit';
import { fetchDataHealth } from './dashboardThunks';

const initialState = {
  usersWithoutManager: [],
  deptsWithoutHOD: [],
  status: 'idle',
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDataHealth.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchDataHealth.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.usersWithoutManager = action.payload.usersWithoutManager;
        state.deptsWithoutHOD = action.payload.deptsWithoutHOD;
      })
      .addCase(fetchDataHealth.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;