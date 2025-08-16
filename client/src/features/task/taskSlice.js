import { createSlice } from '@reduxjs/toolkit';
import { 
  fetchMyTasks, 
  fetchTeamTasks, 
  createTask, 
  updateTaskStatus,
  fetchTasksCreatedByMe,
  fetchAllTasks, 
 } from './taskThunks';

const initialState = {
  myTasks: [],      
  teamTasks: [],
  createdTasks: [],  
  allTasks: [],  
  status: 'idle',
  error: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching my tasks (employee)
      .addCase(fetchMyTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myTasks = action.payload;
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for fetching team tasks (manager)
      .addCase(fetchTeamTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTeamTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teamTasks = action.payload;
      })
      .addCase(fetchTeamTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(fetchTasksCreatedByMe.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTasksCreatedByMe.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.createdTasks = action.payload;
      })
      .addCase(fetchTasksCreatedByMe.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchAllTasks.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allTasks = action.payload;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Generic cases for Create/Update operations
      .addMatcher(
        (action) => [createTask.pending, updateTaskStatus.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createTask.fulfilled, updateTaskStatus.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        (action) => [createTask.rejected, updateTaskStatus.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      )
      
  },
});

export default taskSlice.reducer;