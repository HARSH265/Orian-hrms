// In: client/src/features/customFields/customFieldSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { fetchCustomFields, createCustomField } from './customFieldThunks';

const initialState = {
  fields: [],
  status: 'idle',
  error: null,
};

const customFieldSlice = createSlice({
  name: 'customFields',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomFields.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchCustomFields.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.fields = action.payload;
      })
      .addCase(fetchCustomFields.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createCustomField.pending, (state) => { state.status = 'loading'; })
      .addCase(createCustomField.fulfilled, (state) => { state.status = 'succeeded'; })
      .addCase(createCustomField.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default customFieldSlice.reducer;