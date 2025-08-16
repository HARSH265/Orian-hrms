import { createSlice } from '@reduxjs/toolkit';
import { fetchAllUsers, createNewUser,updateUser, deactivateUser,fetchAllManagers } from './adminThunks';

const initialState = {
  users: [], 
  managers: [],
  status: 'idle',
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching all users
      .addCase(fetchAllUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for creating a new user
      .addCase(createNewUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createNewUser.fulfilled, (state) => {
        // The list is re-fetched by the thunk, so we just reset the status.
        state.status = 'succeeded';
      })
      .addCase(createNewUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
       // --- ADD THESE NEW CASES ---
      // Cases for updating a user
      .addCase(updateUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for deactivating a user
      .addCase(deactivateUser.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deactivateUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(deactivateUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllManagers.fulfilled, (state, action) => {
        state.managers = action.payload;
      });
  },
});

export default adminSlice.reducer;