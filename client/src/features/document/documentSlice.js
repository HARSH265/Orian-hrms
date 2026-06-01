import { createSlice } from '@reduxjs/toolkit';
import {
  fetchAllDocuments,
  fetchMyDocuments,
} from './documentThunks';

const initialState = {
  adminDocuments: [], // All documents for the admin view
  employeeDocuments: [], // Active documents for the employee view
  status: 'idle',
  error: null,
};

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch All Documents (Admin)
      .addCase(fetchAllDocuments.fulfilled, (state, action) => {
        state.adminDocuments = action.payload;
      })
      // Fetch My Documents (Employee)
      .addCase(fetchMyDocuments.fulfilled, (state, action) => {
        state.employeeDocuments = action.payload;
      })
      // Use matchers for generic state handling (pending, rejected)
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => {
          state.status = 'succeeded';
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default documentSlice.reducer;