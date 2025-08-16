import { createSlice } from '@reduxjs/toolkit';
import { fetchMyNotifications, } from './notificationThunks';

const initialState = {
  notifications: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload;
        // Calculate the unread count after fetching
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // We don't need explicit cases for markAsRead if it just re-fetches
  },
});

export default notificationSlice.reducer;