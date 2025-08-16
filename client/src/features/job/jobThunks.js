import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// --- Thunks for Jobs ---
export const fetchAllJobs = createAsyncThunk('job/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/jobs'); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const createJob = createAsyncThunk('job/create', async (jobData, { dispatch, rejectWithValue }) => {
  try { await api.post('/jobs', jobData); dispatch(fetchAllJobs()); }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
// ... (You can add updateJob and deleteJob thunks here following the same pattern)

// --- Thunks for Referrals ---
export const submitReferral = createAsyncThunk('referral/submit', async (referralData, { rejectWithValue }) => {
  try { const { data } = await api.post('/referrals', referralData); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const fetchAllReferrals = createAsyncThunk('referral/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/referrals'); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});
export const updateReferralStatus = createAsyncThunk('referral/updateStatus', async ({ referralId, status }, { dispatch, rejectWithValue }) => {
  try { await api.put(`/referrals/${referralId}`, { status }); dispatch(fetchAllReferrals()); }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});