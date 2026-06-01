import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// --- Admin Thunks ---
export const initiateReviewCycle = createAsyncThunk(
  'review/initiateCycle',
  async ({ cycleName, employeeIds }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/reviews/initiate-cycle', { cycleName, employeeIds });
      return data.message; // Return success message
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

// --- Employee Thunks ---
export const fetchMyReviews = createAsyncThunk('review/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/reviews/my-reviews');
    return data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const submitSelfAssessment = createAsyncThunk(
  'review/submitSelf',
  async ({ reviewId, selfAssessment }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/reviews/${reviewId}/self-assessment`, { selfAssessment });
      dispatch(fetchMyReviews()); // Refresh list after submitting
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

// --- Manager Thunks ---
export const fetchTeamReviews = createAsyncThunk('review/fetchTeam', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/reviews/team-reviews');
    return data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const submitManagerReview = createAsyncThunk(
  'review/submitManager',
  async ({ reviewId, managerReview }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/reviews/${reviewId}/manager-review`, { managerReview });
      dispatch(fetchTeamReviews()); // Refresh list after submitting
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);