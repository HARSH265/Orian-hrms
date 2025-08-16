import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';


// For the Employee's "My Tasks" page
export const fetchMyTasks = createAsyncThunk('task/fetchMyTasks', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks/my-tasks');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

// For the Manager's "Team Tasks" page
export const fetchTeamTasks = createAsyncThunk('task/fetchTeamTasks', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks/team-tasks');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

// For a manager creating a new task
export const createTask = createAsyncThunk('task/create', async (taskData, { dispatch, rejectWithValue }) => {
  try {
    await api.post('/tasks', taskData);
    dispatch(fetchTeamTasks()); // Refresh the team's task list
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

// For an employee updating the status of their task
export const updateTaskStatus = createAsyncThunk('task/updateStatus', async ({ taskId, status }, { dispatch, rejectWithValue }) => {
  try {
    await api.put(`/tasks/${taskId}/status`, { status });
    dispatch(fetchMyTasks()); // Refresh the user's own task list
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const fetchTasksCreatedByMe = createAsyncThunk(
  'task/fetchCreatedByMe',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/tasks/created-by-me');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
)
// For the Admin's Global Task Dashboard
export const fetchAllTasks = createAsyncThunk('task/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/tasks/all');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
})

// We should also add the full update and delete thunks now
export const updateTask = createAsyncThunk('task/update', async ({ taskId, taskData }, { dispatch, rejectWithValue }) => {
  try {
    await api.put(`/tasks/${taskId}`, taskData);
    // Depending on who is updating, we might want to refresh a different list.
    // For now, let's assume this is for admins and refresh the main list.
    dispatch(fetchAllTasks()); 
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const deleteTask = createAsyncThunk('task/delete', async (taskId, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/tasks/${taskId}`);
    dispatch(fetchAllTasks());
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});


// We can add thunks for full update and delete later if needed