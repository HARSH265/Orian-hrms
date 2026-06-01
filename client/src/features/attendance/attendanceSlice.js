import { createSlice } from '@reduxjs/toolkit';
import { fetchMyAttendance, clockIn, clockOut, fetchTeamAttendance } from './attendanceThunks';

const initialState = {
  myRecords: [],
  teamRecords: [],
  todaysRecord: null,
  status: 'idle',
  error: null,
};

const getStartOfTodayISO = () => new Date(new Date().setHours(0,0,0,0)).toISOString().split('T')[0];

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAttendance.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyAttendance.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myRecords = action.payload;
        // Find today's record from the fetched data
        const todayStr = getStartOfTodayISO();
        state.todaysRecord = action.payload.find(r => new Date(r.date).toISOString().split('T')[0] === todayStr) || null;
      })
      .addCase(fetchMyAttendance.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchTeamAttendance.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teamRecords = action.payload;
      })
      // Matchers for clock in/out
      .addMatcher(
        (action) => [clockIn.pending, clockOut.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [clockIn.rejected, clockOut.rejected].includes(action.type),
        (state, action) => { state.status = 'failed'; state.error = action.payload; }
      )
      .addMatcher(
        (action) => [clockIn.fulfilled, clockOut.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      );
  },
});

export default attendanceSlice.reducer;