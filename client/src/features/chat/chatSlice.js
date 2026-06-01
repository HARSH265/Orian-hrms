import { createSlice } from '@reduxjs/toolkit';
import { getConversations, getMessages, findOrCreateConversation } from './chatThunks';

const initialState = {
  conversations: [],
  messages: {}, // key: conversationId, value: array of messages
  unreadCount: 0,
  activeConversationId: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Action to set the currently viewed conversation
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },

    setUnreadCount: (state, action) => { // <-- ADD THIS REDUCER
        state.unreadCount = action.payload;
    },
    // Action to add a new message received in real-time from Socket.IO
    // --- REPLACE your addMessage reducer with this new, smarter version ---
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;

      // 1. Add the new message to the messages list (this is the same as before)
      if (state.messages[conversationId]) {
        state.messages[conversationId].push(message);
      } else {
        state.messages[conversationId] = [message];
      }
      
      // 2. Find the corresponding conversation in the list
      const conversationIndex = state.conversations.findIndex(c => c._id === conversationId);
      
      if (conversationIndex !== -1) {
        // 3. Update the conversation's 'lastMessage' preview
        const conversationToUpdate = state.conversations[conversationIndex];
        conversationToUpdate.lastMessage = {
            text: message.text,
            sender: message.sender, // The populated sender object from the payload
            createdAt: message.createdAt,
        };

        // 4. Move the updated conversation to the top of the list
        state.conversations.splice(conversationIndex, 1); // Remove from its current position
        state.conversations.unshift(conversationToUpdate); // Add to the front
      }
    },

    // Clear chat state on logout, for example
    clearChat: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Get all conversations
      .addCase(getConversations.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.conversations = action.payload;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Get messages for a specific conversation
      .addCase(getMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages[action.payload.conversationId] = action.payload.messages;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Find or create a conversation
      .addCase(findOrCreateConversation.fulfilled, (state, action) => {
        const newConversation = action.payload;
        // Avoid adding duplicates if it already exists
        if (!state.conversations.some(c => c._id === newConversation._id)) {
          state.conversations.unshift(newConversation); // Add to the top
        }
        // Automatically make it the active conversation
        state.activeConversationId = newConversation._id;
      });
  },
});

export const { setActiveConversation, addMessage, clearChat,setUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;