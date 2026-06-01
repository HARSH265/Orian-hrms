import { createSlice } from '@reduxjs/toolkit';
import { fetchKudosFeed, fetchUserKudos, createKudos } from './kudosThunks';

const initialState = {
  feed: [],
  userKudos: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const kudosSlice = createSlice({
  name: 'kudos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Kudos Feed
      .addCase(fetchKudosFeed.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchKudosFeed.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.feed = action.payload;
      })
      .addCase(fetchKudosFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch User's Kudos
      .addCase(fetchUserKudos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUserKudos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userKudos = action.payload;
      })
      .addCase(fetchUserKudos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create Kudos
      .addCase(createKudos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createKudos.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null; // Clear previous errors on success
      })
      .addCase(createKudos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default kudosSlice.reducer;