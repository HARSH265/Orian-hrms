import { createSlice } from '@reduxjs/toolkit';
import { fetchMyNotifications, markNotificationAsRead } from './notificationThunks'; // Ensure markNotificationAsRead is imported if used

const initialState = {
  notifications: [],
  unreadCount: 0,
  status: 'idle',
  error: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // --- REAL-TIME NOTIFICATION UPGRADE: Add this reducer ---
    addNotification: (state, action) => {
      // The `action.payload` will be the new notification object from the server.
      
      // 1. Add the new notification to the top of the list for immediate visibility.
      // We check to prevent potential duplicates if an event arrives multiple times.
      const exists = state.notifications.some(n => n._id === action.payload._id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        
        // 2. Increment the unread count.
        state.unreadCount += 1;
      }
    },
    // --- END UPGRADE ---
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => { 
        state.status = 'loading'; 
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.notifications = action.payload;
        // Calculate the unread count after fetching the full list
        state.unreadCount = action.payload.filter(n => !n.isRead).length;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // --- GOOD PRACTICE: Handle the state after marking a notification as read ---
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        // `action.payload` is the updated notification from the server { ..., isRead: true }
        const updatedNotification = action.payload;
        const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
        
        if (index !== -1) {
          // If the notification was previously unread, decrement the count
          if (!state.notifications[index].isRead) {
            state.unreadCount -= 1;
          }
          // Update the notification in the list to be read
          state.notifications[index] = updatedNotification;
        }
      });
  },
});

// --- REAL-TIME NOTIFICATION UPGRADE: Export the new action ---
export const { addNotification } = notificationSlice.actions;

export default notificationSlice.reducer;