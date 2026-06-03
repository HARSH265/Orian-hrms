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

const updateListAfterMutation = (list, updatedTask) => {
    const idx = list.findIndex(t => t._id === updatedTask._id);
    if (idx !== -1) list[idx] = { ...list[idx], ...updatedTask };
};

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

      .addCase(fetchTaskById.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        state.selectedTaskDetails = action.payload;
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
      
      .addCase(createTask.fulfilled, (state, action) => {
        state.myTasks.data.unshift(action.payload);
      })

      .addCase(createSubTask.fulfilled, (state, action) => {
        if (state.selectedTaskDetails) { state.selectedTaskDetails.subTasks.push(action.payload); }
      })

      .addCase(updateTask.fulfilled, (state, action) => {
        const updated = action.payload;
        if (state.selectedTaskDetails && state.selectedTaskDetails._id === updated._id) {
            state.selectedTaskDetails = updated;
        }
        updateListAfterMutation(state.myTasks.data, updated);
        updateListAfterMutation(state.teamTasks.data, updated);
        updateListAfterMutation(state.allTasks.data, updated);
        updateListAfterMutation(state.createdTasks.data, updated);
      })

      .addCase(updateTaskStatus.fulfilled, (state, action) => {
          const updatedTask = action.payload;
          if (state.selectedTaskDetails && state.selectedTaskDetails._id === updatedTask._id) {
              state.selectedTaskDetails = updatedTask;
          }
          updateListAfterMutation(state.myTasks.data, updatedTask);
          updateListAfterMutation(state.teamTasks.data, updatedTask);
          updateListAfterMutation(state.allTasks.data, updatedTask);
          updateListAfterMutation(state.createdTasks.data, updatedTask);
      })

      .addCase(deleteTask.fulfilled, (state, action) => {
        const id = action.payload;
        state.myTasks.data = state.myTasks.data.filter(t => t._id !== id);
        state.teamTasks.data = state.teamTasks.data.filter(t => t._id !== id);
        state.allTasks.data = state.allTasks.data.filter(t => t._id !== id);
        state.createdTasks.data = state.createdTasks.data.filter(t => t._id !== id);
        if (state.selectedTaskDetails && state.selectedTaskDetails._id === id) {
            state.selectedTaskDetails = null;
            state.isDetailsModalOpen = false;
        }
      })

      .addCase(addCommentToTask.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(addCommentToTask.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        if (state.selectedTaskDetails) { state.selectedTaskDetails.comments = action.payload.comments; }
      })
      .addCase(addCommentToTask.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(addAttachmentToTask.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(addAttachmentToTask.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        if (state.selectedTaskDetails) { state.selectedTaskDetails.attachments = action.payload.attachments; }
      })
      .addCase(addAttachmentToTask.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(logTimeToTask.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        state.selectedTaskDetails = action.payload;
      })
      .addCase(logTimeToTask.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(logTimeToTask.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })
      
      .addCase(requestTaskReopen.fulfilled, (state) => { state.selectedTaskStatus = 'succeeded'; })
      .addCase(requestTaskReopen.rejected, (state, action) => { state.error = action.payload; })

      .addCase(resolveTaskReopen.pending, (state) => { state.selectedTaskStatus = 'loading'; })
      .addCase(resolveTaskReopen.fulfilled, (state) => { state.selectedTaskStatus = 'succeeded'; })
      .addCase(resolveTaskReopen.rejected, (state, action) => {
        state.selectedTaskStatus = 'failed';
        state.error = action.payload;
      })

      .addCase(updateTaskDependencies.fulfilled, (state, action) => {
        state.selectedTaskStatus = 'succeeded';
        state.selectedTaskDetails = action.payload;
      })
      .addCase(updateTaskDependencies.pending, (state) => { state.selectedTaskStatus = 'loading'; })
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