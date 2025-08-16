import { createSlice } from '@reduxjs/toolkit';
import { fetchAllJobs, /* updateJob, deleteJob */ } from './jobThunks';

const initialState = { jobs: [], status: 'idle', error: null };

const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllJobs.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllJobs.fulfilled, (state, action) => { state.status = 'succeeded'; state.jobs = action.payload; })
      .addCase(fetchAllJobs.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      // Add matchers for create/update/delete if you build them
  },
});

export default jobSlice.reducer;