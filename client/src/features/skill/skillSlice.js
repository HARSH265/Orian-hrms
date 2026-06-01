import { createSlice } from '@reduxjs/toolkit';
import { fetchAllSkills, createSkill, updateSkill, archiveSkill } from './skillThunks';

const initialState = { skills: [], status: 'idle', error: null };

const skillSlice = createSlice({
  name: 'skill',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllSkills.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllSkills.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.skills = action.payload;
      })
      .addCase(fetchAllSkills.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Matchers for CUD operations
      .addMatcher(
        (action) => [createSkill.pending, updateSkill.pending, archiveSkill.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createSkill.fulfilled, updateSkill.fulfilled, archiveSkill.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        (action) => [createSkill.rejected, updateSkill.rejected, archiveSkill.rejected].includes(action.type),
        (state, action) => { state.status = 'failed'; state.error = action.payload; }
      );
  },
});

export default skillSlice.reducer;