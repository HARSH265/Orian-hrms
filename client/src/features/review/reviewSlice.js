import { createSlice } from '@reduxjs/toolkit';
import { fetchMyReviews, fetchTeamReviews, /* other thunks */ } from './reviewThunks';

const initialState = {
  myReviews: [],
  teamReviews: [],
  status: 'idle',
  error: null,
};

const reviewSlice = createSlice({
  name: 'review',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handle pending/rejected for all thunks with matchers for simplicity
    builder
     // Specific fulfilled cases to update state
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.myReviews = action.payload;
      })
      .addCase(fetchTeamReviews.fulfilled, (state, action) => {
        state.teamReviews = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith('review/') && action.type.endsWith('/pending'),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => action.type.startsWith('review/') && action.type.endsWith('/rejected'),
        (state, action) => { state.status = 'failed'; state.error = action.payload; }
      )
      .addMatcher(
        (action) => action.type.startsWith('review/') && action.type.endsWith('/fulfilled'),
        (state) => { state.status = 'succeeded'; }
      )
     
  },
});

export default reviewSlice.reducer;