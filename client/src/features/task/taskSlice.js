import { createSlice } from '@reduxjs/toolkit';

import { 
    fetchMyTasks, 
    fetchTeamTasks, 
    fetchTasksCreatedByMe, 
    fetchAllTasks, 
    fetchTaskById, 
    createTask,
    createSubTask, 
    updateTask,
    updateTaskStatus, 
    deleteTask,
    addCommentToTask, 
    addAttachmentToTask,
    requestTaskReopen, 
    resolveTaskReopen ,
    updateTaskDependencies,
    logTimeToTask,
    toggleTaskSubscription
} from './taskThunks';


const listInitialState = {
    data: [],
    status: 'idle',
    pagination: { total: 0, page: 1, pages: 1 },
};

const initialState = {
  myTasks: { ...listInitialState },
  teamTasks: { ...listInitialState },
  allTasks: { ...listInitialState },
  createdTasks: { ...listInitialState },
  
  selectedTaskDetails: null, 
  selectedTaskStatus: 'idle',
  
  isDetailsModalOpen: false,
  viewingTaskId: null,
  error: null,
};

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    openTaskDetailsModal: (state, action) => {
        state.isDetailsModalOpen = true;
        state.viewingTaskId = action.payload;
    },
    closeTaskDetailsModal: (state) => {
        state.isDetailsModalOpen = false;
        state.viewingTaskId = null;
        state.selectedTaskDetails = null;
        state.selectedTaskStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // My Tasks Cases
      .addCase(fetchMyTasks.pending, (state) => { state.myTasks.status = 'loading'; })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.myTasks.status = 'succeeded';
        state.myTasks.data = action.payload.data;
        state.myTasks.pagination = action.payload.pagination;
      })
      .addCase(fetchMyTasks.rejected, (state, action) => {
        state.myTasks.status = 'failed';
        state.error = action.payload;
      })

      // Team Tasks Cases
      .addCase(fetchTeamTasks.pending, (state) => { state.teamTasks.status = 'loading'; })
      .addCase(fetchTeamTasks.fulfilled, (state, action) => {
        state.teamTasks.status = 'succeeded';
        state.teamTasks.data = action.payload.data;
        state.teamTasks.pagination = action.payload.pagination;
      })
      .addCase(fetchTeamTasks.rejected, (state, action) => {
        state.teamTasks.status = 'failed';
        state.error = action.payload;
      })
      
      // All Tasks Cases
      .addCase(fetchAllTasks.pending, (state) => { state.allTasks.status = 'loading'; })
      .addCase(fetchAllTasks.fulfilled, (state, action) => {
        state.allTasks.status = 'succeeded';
        state.allTasks.data = action.payload.data;
        state.allTasks.pagination = action.payload.pagination;
      })
      .addCase(fetchAllTasks.rejected, (state, action) => {
        state.allTasks.status = 'failed';
        state.error = action.payload;
      })

      // Created By Me Cases
      .addCase(fetchTasksCreatedByMe.pending, (state) => { state.createdTasks.status = 'loading'; })
      .addCase(fetchTasksCreatedByMe.fulfilled, (state, action) => {
        state.createdTasks.status = 'succeeded';
        state.createdTasks.data = action.payload.data;
        state.createdTasks.pagination = action.payload.pagination;
      })
      .addCase(fetchTasksCreatedByMe.rejected, (state, action) => {
        state.createdTasks.status = 'failed';
        state.error = action.payload;
      })

      // Selected Task (Modal) Cases
      .addCase(fetchTaskById.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        state.selectedTaskDetails = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
      
      // Mutation cases that affect the selectedTaskDetails state
      .addCase(createSubTask.fulfilled, (state, action) => {
        if (state.selectedTaskDetails) { state.selectedTaskDetails.subTasks.push(action.payload); }
      })
      .addCase(addCommentToTask.fulfilled, (state, action) => {
        if (state.selectedTaskDetails) { state.selectedTaskDetails.comments = action.payload.comments; }
      })
      .addCase(addAttachmentToTask.fulfilled, (state, action) => {
        if (state.selectedTaskDetails) { state.selectedTaskDetails.attachments = action.payload.attachments; }
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
          const updatedTask = action.payload;
          if (state.selectedTaskDetails && state.selectedTaskDetails._id === updatedTask._id) {
              state.selectedTaskDetails.status = updatedTask.status;
          }
      })

      .addCase(logTimeToTask.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        // The API returns the full updated task, so we just replace our detailed view
        state.selectedTaskDetails = action.payload;
      })
      .addCase(logTimeToTask.pending, (state) => {
        state.selectedTaskStatus = 'loading';
      })
      .addCase(logTimeToTask.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
      
      // --- NEW: Pending/Rejected states for the re-open workflow ---
      .addCase(requestTaskReopen.pending, (state) => {
        // We don't change the main status, just show feedback where it's needed
      })
      .addCase(requestTaskReopen.rejected, (state, action) => {
        state.error = action.payload; // Set a general error
      })
      .addCase(resolveTaskReopen.pending, (state) => {
        state.selectedTaskStatus = 'loading'; // Show feedback in the modal
      })
      .addCase(resolveTaskReopen.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
       .addCase(updateTaskDependencies.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        state.selectedTaskDetails = action.payload;
      })
      .addCase(updateTaskDependencies.pending, (state) => {
        state.selectedTaskStatus = 'loading';
      })
      .addCase(updateTaskDependencies.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(toggleTaskSubscription.fulfilled, (state, action) => {
        if (state.selectedTaskDetails && state.selectedTaskDetails._id === action.payload.task._id) {
            state.selectedTaskDetails.subscribers = action.payload.task.subscribers;
        }
      });
  },
});

export const { openTaskDetailsModal, closeTaskDetailsModal } = taskSlice.actions;
export default taskSlice.reducer;