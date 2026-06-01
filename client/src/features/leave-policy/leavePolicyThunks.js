import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// --- For Admin Management of Policies ---
export const fetchLeavePolicies = createAsyncThunk(
  'leavePolicy/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/leave-policies');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createLeavePolicy = createAsyncThunk(
  'leavePolicy/create',
  async (policyData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/leave-policies', policyData);
      dispatch(fetchLeavePolicies());
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- For Employee's Balances ---
export const fetchMyLeaveBalances = createAsyncThunk(
  'leaveBalance/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/leave-balances/my-balances');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- For Admin assigning policies ---
export const assignPolicyToEmployee = createAsyncThunk(
  'leavePolicy/assign',
  async (payload, { rejectWithValue }) => { 
    try {
      const { data } = await api.post('/leave-balances', payload); 
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);