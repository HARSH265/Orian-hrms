// In: client/src/features/dashboard/dashboardSlice.js

import { createSlice } from '@reduxjs/toolkit';
import { fetchDataHealth, fetchTaskMetrics, fetchLeaveMetrics } from './dashboardThunks';

const initialState = {
  // Data Health
  usersWithoutManager: [],
  deptsWithoutHOD: [],
  dataHealthStatus: 'idle',
  
  // Task Metrics
  taskMetrics: {
    totalTasks: 0,
    overdueTasks: 0,
    completedToday: 0,
    tasksByStatus: {},
  },
  taskMetricsStatus: 'idle',

  // Leave Metrics
  leaveMetrics: {
    pendingRequests: 0,
    onLeaveToday: [],
    leaveByType: {},
  },
  leaveMetricsStatus: 'idle',

  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Data Health Cases
      .addCase(fetchDataHealth.pending, (state) => { state.dataHealthStatus = 'loading'; })
      .addCase(fetchDataHealth.fulfilled, (state, action) => {
        state.dataHealthStatus = 'succeeded';
        state.usersWithoutManager = action.payload.usersWithoutManager;
        state.deptsWithoutHOD = action.payload.deptsWithoutHOD;
      })
      .addCase(fetchDataHealth.rejected, (state, action) => {
        state.dataHealthStatus = 'failed';
        state.error = action.payload;
      })

      // Task Metrics Cases
      .addCase(fetchTaskMetrics.pending, (state) => { state.taskMetricsStatus = 'loading'; })
      .addCase(fetchTaskMetrics.fulfilled, (state, action) => {
        state.taskMetricsStatus = 'succeeded';
        state.taskMetrics = action.payload;
      })
      .addCase(fetchTaskMetrics.rejected, (state, action) => {
        state.taskMetricsStatus = 'failed';
        state.error = action.payload;
      })

      // Leave Metrics Cases
      .addCase(fetchLeaveMetrics.pending, (state) => { state.leaveMetricsStatus = 'loading'; })
      .addCase(fetchLeaveMetrics.fulfilled, (state, action) => {
        state.leaveMetricsStatus = 'succeeded';
        state.leaveMetrics = action.payload;
      })
      .addCase(fetchLeaveMetrics.rejected, (state, action) => {
        state.leaveMetricsStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;