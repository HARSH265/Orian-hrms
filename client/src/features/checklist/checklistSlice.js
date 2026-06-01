import { createSlice } from '@reduxjs/toolkit';
import { fetchChecklistTemplates, createChecklistTemplate, applyChecklistTemplate,fetchUserChecklists, fetchActiveChecklists, updateChecklistTemplate, deleteChecklistTemplate } from './checklistThunks';

const initialState = {
  templates: [],
  status: 'idle',
  error: null,
   userChecklists: [],
  userChecklistsStatus: 'idle',
  activeChecklists: [],
  activeChecklistsStatus: 'idle',
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
       .addCase(fetchUserChecklists.pending, (state) => {
        state.userChecklistsStatus = 'loading';
      })
      .addCase(fetchUserChecklists.fulfilled, (state, action) => {
        state.userChecklistsStatus = 'succeeded';
        state.userChecklists = action.payload;
      })
      .addCase(fetchUserChecklists.rejected, (state, action) => {
        state.userChecklistsStatus = 'failed';
        state.error = action.payload;
      })

       .addCase(fetchActiveChecklists.pending, (state) => {
        state.activeChecklistsStatus = 'loading';
      })
      .addCase(fetchActiveChecklists.fulfilled, (state, action) => {
        state.activeChecklistsStatus = 'succeeded';
        state.activeChecklists = action.payload;
      })
      .addCase(fetchActiveChecklists.rejected, (state, action) => {
        state.activeChecklistsStatus = 'failed';
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
      )

      .addMatcher(
        // Add the new thunks to the matcher for pending states
        (action) => [createChecklistTemplate.pending, applyChecklistTemplate.pending, updateChecklistTemplate.pending, deleteChecklistTemplate.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        // Add the new thunks to the matcher for fulfilled states
        (action) => [createChecklistTemplate.fulfilled, applyChecklistTemplate.fulfilled, updateChecklistTemplate.fulfilled, deleteChecklistTemplate.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        // Add the new thunks to the matcher for rejected states
        (action) => [createChecklistTemplate.rejected, applyChecklistTemplate.rejected, updateChecklistTemplate.rejected, deleteChecklistTemplate.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default checklistSlice.reducer;