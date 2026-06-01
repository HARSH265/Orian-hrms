import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// For Admin: Get all documents (active and inactive)
export const fetchAllDocuments = createAsyncThunk(
  'document/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/documents');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Employees: Get all active, viewable documents
export const fetchMyDocuments = createAsyncThunk(
  'document/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/documents/my-documents');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Admin: Upload a new document
export const uploadDocument = createAsyncThunk(
  'document/upload',
  async (documentData, { dispatch, rejectWithValue }) => {
    try {
      await api.post('/documents', documentData);
      dispatch(fetchAllDocuments()); // Refresh the admin list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Employees: Acknowledge a document
export const acknowledgeDocument = createAsyncThunk(
  'document/acknowledge',
  async (documentId, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/documents/${documentId}/acknowledge`);
      // Refresh both lists, as this action affects both views
      dispatch(fetchMyDocuments());
      dispatch(fetchAllDocuments());
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Admin: Soft delete a document
export const softDeleteDocument = createAsyncThunk(
  'document/delete',
  async (documentId, { dispatch, rejectWithValue }) => {
    try {
      await api.delete(`/documents/${documentId}`);
      dispatch(fetchAllDocuments()); // Refresh the admin list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);