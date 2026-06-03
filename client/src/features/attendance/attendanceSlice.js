import { createSlice } from '@reduxjs/toolkit';
import { fetchMyAttendance, fetchMyAttendanceSummary, clockIn, clockOut, fetchTeamAttendance } from './attendanceThunks';

const initialState = {
  myRecords: [],
  teamRecords: [],
  summary: null,
  todaysRecord: null,
  myStatus: 'idle',
  teamStatus: 'idle',
  summaryStatus: 'idle',
  error: null,
};

const getTodayUTCDate = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearAttendanceError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAttendance.pending, (state) => { state.myStatus = 'loading'; })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.myStatus = 'succeeded';
        state.myRecords = action.payload;
        const today = getTodayUTCDate().getTime();
        state.todaysRecord = action.payload.find(r => {
          const d = new Date(r.date);
          return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) === today;
        }) || null;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.myStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMyAttendanceSummary.pending, (state) => { state.summaryStatus = 'loading'; })
      .addCase(fetchMyAttendanceSummary.fulfilled, (state, action) => {
        state.summaryStatus = 'succeeded';
        state.summary = action.payload;
      })
      .addCase(fetchMyAttendanceSummary.rejected, (state, action) => {
        state.summaryStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchTeamAttendance.pending, (state) => { state.teamStatus = 'loading'; })
      .addCase(fetchTeamAttendance.fulfilled, (state, action) => {
        state.teamStatus = 'succeeded';
        state.teamRecords = action.payload;
      })
      .addCase(fetchTeamAttendance.rejected, (state, action) => {
        state.teamStatus = 'failed';
        state.error = action.payload;
      })
      .addMatcher(
        (action) => [clockIn.pending, clockOut.pending].includes(action.type),
        (state) => { state.myStatus = 'loading'; }
      )
      .addMatcher(
        (action) => [clockIn.rejected, clockOut.rejected].includes(action.type),
        (state, action) => { state.myStatus = 'failed'; state.error = action.payload; }
      )
      .addMatcher(
        (action) => [clockIn.fulfilled, clockOut.fulfilled].includes(action.type),
        (state) => { state.myStatus = 'succeeded'; }
      );
  },
});

export const { clearAttendanceError } = attendanceSlice.actions;
export default attendanceSlice.reducer;