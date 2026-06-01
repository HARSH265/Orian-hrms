import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchKudosFeed = createAsyncThunk(
  'kudos/fetchFeed',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/kudos');
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

export const fetchUserKudos = createAsyncThunk(
  'kudos/fetchUserKudos',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/kudos/user/${userId}`);
      return data.data;
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);

export const createKudos = createAsyncThunk(
  'kudos/create',
  async (kudosData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/kudos', kudosData);
      // After creating, refresh the main feed to show the new kudos
      dispatch(fetchKudosFeed()); 
    } catch (error) {
      const message = (error.response?.data?.message) || error.message || error.toString();
      return rejectWithValue(message);
    }
  }
);