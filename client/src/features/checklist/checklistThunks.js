import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchChecklistTemplates = createAsyncThunk(
  'checklist/fetchAllTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/checklist-templates');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createChecklistTemplate = createAsyncThunk(
  'checklist/createTemplate',
  async (templateData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/checklist-templates', templateData);
      dispatch(fetchChecklistTemplates()); // Refresh the list after creation
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);


export const applyChecklistTemplate = createAsyncThunk(
  'checklist/applyTemplate',
  // --- THE FIX: The payload now expects targetUserId to match the backend ---
  async ({ templateId, targetUserId, startDate }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checklist-templates/apply', { templateId, targetUserId, startDate });
      return data.message;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchUserChecklists = createAsyncThunk(
  'checklist/fetchUserChecklists',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/users/${userId}/checklist-instances`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchActiveChecklists = createAsyncThunk(
  'checklist/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/checklist-instances/active');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateChecklistTemplate = createAsyncThunk(
  'checklist/updateTemplate',
  async ({ templateId, templateData }, { dispatch, rejectWithValue }) => {
    try {
      // --- THE FIX: templateData is the second argument to api.put ---
      await api.put(`/checklist-templates/${templateId}`, templateData);
      dispatch(fetchChecklistTemplates());
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
)

export const deleteChecklistTemplate = createAsyncThunk(
  'checklist/deleteTemplate',
  async (templateId, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/checklist-templates/${templateId}`);
      // Refresh the list after a successful deletion.
      dispatch(fetchChecklistTemplates());
      return data.message; // Return success message for notification
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);