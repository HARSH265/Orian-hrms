import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchAnnouncements = createAsyncThunk(
  'announcement/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/announcements');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch announcements');
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcement/create',
  async (announcementData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/announcements', announcementData);
      dispatch(fetchAnnouncements());
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create announcement');
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'announcement/update',
  async ({ announcementId, announcementData }, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.put(`/announcements/${announcementId}`, announcementData);
      dispatch(fetchAnnouncements());
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update announcement');
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcement/delete',
  async (announcementId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/announcements/${announcementId}`);
      dispatch(fetchAnnouncements());
      return announcementId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete announcement');
    }
  }
);