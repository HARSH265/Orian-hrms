import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchAnnouncements, 
    createAnnouncement, 
    updateAnnouncement, 
    deleteAnnouncement 
} from './announcementThunks';

const initialState = {
  announcements: [],
  status: 'idle',
  error: null,
};

const announcementSlice = createSlice({
  name: 'announcement',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching
      .addCase(fetchAnnouncements.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.announcements = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Generic cases for CUD operations since they all just trigger a re-fetch
      .addMatcher(
        (action) => [createAnnouncement.pending, updateAnnouncement.pending, deleteAnnouncement.pending].includes(action.type),
        (state) => {
          state.status = 'loading';
        }
      )
      .addMatcher(
        (action) => [createAnnouncement.fulfilled, updateAnnouncement.fulfilled, deleteAnnouncement.fulfilled].includes(action.type),
        (state) => {
          state.status = 'succeeded';
        }
      )
      .addMatcher(
        (action) => [createAnnouncement.rejected, updateAnnouncement.rejected, deleteAnnouncement.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default announcementSlice.reducer;