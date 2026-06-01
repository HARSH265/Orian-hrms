// In: client/src/features/task/taskThunk.js

import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// For the Employee's "My Tasks" page - UPGRADED
export const fetchMyTasks = createAsyncThunk('task/fetchMyTasks',
  async ({ page, limit, sortBy, order, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, sortBy, order });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      const { data } = await api.get(`/tasks/my-tasks?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For the Manager's "Team Tasks" page - UPGRADED
export const fetchTeamTasks = createAsyncThunk('task/fetchTeamTasks',
  async ({ page, limit, sortBy, order, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, sortBy, order });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.search) params.append('search', filters.search);
      const { data } = await api.get(`/tasks/team-tasks?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For creating a new task - UPGRADED for multiple assignees
export const createTask = createAsyncThunk('task/create', 
  // --- CHANGE: The first argument is `taskData` which now contains an `assignees` array ---
  async (taskData, { rejectWithValue }) => {
    try {
      // The backend now returns the newly created task object. We return it.
      const { data } = await api.post('/tasks', taskData);
      return data.data; // This becomes action.payload
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For an employee updating the status of their task
export const updateTaskStatus = createAsyncThunk('task/updateStatus', async ({ taskId, status }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tasks/${taskId}/status`, { status });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const fetchTasksCreatedByMe = createAsyncThunk(
  'task/fetchCreatedByMe',
  // --- UPGRADE: Accept the same parameters as the other list thunks ---
  async ({ page, limit, sortBy, order, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({ page, limit, sortBy, order });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      
      const { data } = await api.get(`/tasks/created-by-me?${params.toString()}`);
      
      // Return the full response object
      return data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For the Admin's Global Task Dashboard - UPGRADED
export const fetchAllTasks = createAsyncThunk(
  'task/fetchAll',
  async ({ page, limit, sortBy, order, filters }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      params.append('sortBy', sortBy);
      params.append('order', order);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.search) params.append('search', filters.search);
      const { data } = await api.get(`/tasks/all?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const fetchTaskById = createAsyncThunk('task/fetchById',
  async (taskId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/tasks/${taskId}`);
      return data.data; // The fully populated task object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const createSubTask = createAsyncThunk('task/createSubTask',
  async ({ parentId, subTaskData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/tasks/${parentId}/subtasks`, subTaskData);
      return data.data; // The newly created sub-task object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateTask = createAsyncThunk('task/update', async ({ taskId, taskData }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/tasks/${taskId}`, taskData);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteTask = createAsyncThunk('task/delete', async (taskId, { rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${taskId}`);
    return taskId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const addCommentToTask = createAsyncThunk('task/addComment', async ({ taskId, text }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
    return { taskId, comments: data.data };
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const addAttachmentToTask = createAsyncThunk('task/addAttachment', async ({ taskId, url, originalName }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/tasks/${taskId}/attachments`, { url, originalName });
    return { taskId, attachments: data.data };
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

// Thunk for an assignee to request a re-open
export const requestTaskReopen = createAsyncThunk('task/requestReopen',
  async ({ taskId, reason }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await api.post(`/tasks/${taskId}/reopen-requests`, { reason });
      // After successfully requesting, re-fetch the task to update its details in the modal.
      const { viewingTaskId } = getState().task;
      if (viewingTaskId === taskId) {
        dispatch(fetchTaskById(viewingTaskId));
      }
      return response.data; // Returns a success message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Thunk for a creator to approve or reject a request
export const resolveTaskReopen = createAsyncThunk('task/resolveReopen',
  async ({ requestId, status }, { dispatch, getState, rejectWithValue }) => {
    try {
      const response = await api.put(`/tasks/reopen-requests/${requestId}`, { status });
      // After resolving, re-fetch the currently viewed task to get the latest state.
      const { viewingTaskId } = getState().task;
      if (viewingTaskId) {
        dispatch(fetchTaskById(viewingTaskId));
      }
      return { ...response.data, status }; // Pass status along for potential optimistic UI
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- THUNK FOR TASK DEPENDENCIES ---
export const updateTaskDependencies = createAsyncThunk('task/updateDependencies',
  async ({ taskId, dependsOn }, { rejectWithValue }) => {
    try {
      // The backend will return the full, updated task object
      const { data } = await api.put(`/tasks/${taskId}/dependencies`, { dependsOn });
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// Add this new thunk to your file

export const logTimeToTask = createAsyncThunk('task/logTime',
  async ({ taskId, timeLogData }, { rejectWithValue }) => {
    try {
      // The backend returns the full, updated task object
      const { data } = await api.post(`/tasks/${taskId}/log-time`, timeLogData);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// --- THUNK FOR TASK SUBSCRIPTION ---
export const toggleTaskSubscription = createAsyncThunk('task/toggleSubscription',
  async (taskId, { rejectWithValue }) => {
    try {
      // The backend will return the full updated task with the new subscribers list
      const { data } = await api.post(`/tasks/${taskId}/subscribe`);
      return { task: data.data, message: data.message }; // Return task and success message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);