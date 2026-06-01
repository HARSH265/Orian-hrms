// In: client/src/features/customFields/customFieldThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchCustomFields = createAsyncThunk('customFields/fetchAll', 
  async (appliesTo = null, { rejectWithValue }) => {
    try {
      const url = appliesTo ? `/custom-fields?appliesTo=${appliesTo}` : '/custom-fields';
      const { data } = await api.get(url);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
});

export const createCustomField = createAsyncThunk('customFields/create', 
  async (fieldData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/custom-fields', fieldData);
      dispatch(fetchCustomFields()); // Refresh list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
});

// We will add update and delete thunks later