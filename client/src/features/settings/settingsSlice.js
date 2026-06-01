import { createSlice } from '@reduxjs/toolkit';
import { fetchSettings, updateSettings } from './settingsThunks';

const initialState = {
  settings: null, // Will hold the single settings object
  status: 'idle',
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.status = 'succeeded';
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
        state.status = 'succeeded';
      })
      // Use matchers for generic state handling
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.status = 'loading';
          state.error = null;
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

export default settingsSlice.reducer;