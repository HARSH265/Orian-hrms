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
  async ({ templateId, targetUserId, startDate }, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/checklist-templates/apply', { templateId, targetUserId, startDate });
      return data.message; // Return the success message from the backend
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);