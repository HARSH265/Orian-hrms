import { createSlice } from '@reduxjs/toolkit';
import { fetchAllReferrals, } from '../job/jobThunks'; // Note: thunks are in jobThunks

const initialState = { referrals: [], status: 'idle', error: null };

const referralSlice = createSlice({
  name: 'referral',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllReferrals.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllReferrals.fulfilled, (state, action) => { state.status = 'succeeded'; state.referrals = action.payload; })
      .addCase(fetchAllReferrals.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      // Add matchers for submit and update status
  },
});

export default referralSlice.reducer;