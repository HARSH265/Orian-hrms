import { createSlice } from '@reduxjs/toolkit';
import { fetchChecklistTemplates, createChecklistTemplate, applyChecklistTemplate } from './checklistThunks';

const initialState = {
  templates: [],
  status: 'idle',
  error: null,
};

const checklistSlice = createSlice({
  name: 'checklist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChecklistTemplates.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchChecklistTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.templates = action.payload;
      })
      .addCase(fetchChecklistTemplates.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addMatcher(
        (action) => [createChecklistTemplate.pending, applyChecklistTemplate.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createChecklistTemplate.fulfilled, applyChecklistTemplate.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        (action) => [createChecklistTemplate.rejected, applyChecklistTemplate.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default checklistSlice.reducer;