import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// For the Admin page
export const fetchAllAssets = createAsyncThunk('asset/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/assets');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const createAsset = createAsyncThunk('asset/create', async (assetData, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.post('/assets', assetData);
    dispatch(fetchAllAssets());
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const updateAsset = createAsyncThunk('asset/update', async ({ assetId, assetData }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/assets/${assetId}`, assetData);
    dispatch(fetchAllAssets());
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteAsset = createAsyncThunk('asset/delete', async (assetId, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/assets/${assetId}`);
    dispatch(fetchAllAssets());
    return assetId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

// For the Employee's Profile page
export const fetchMyAssets = createAsyncThunk('asset/fetchMine', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/assets/my-assets');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});