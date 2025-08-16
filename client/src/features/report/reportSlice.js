import { createSlice } from '@reduxjs/toolkit';
import { fetchLeaveByDepartment, fetchExpensesByCategory } from './reportThunks';

const initialState = {
  leaveByDepartment: [],
  expensesByCategory: [],
  status: 'idle',
  error: null,
};

const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for Leave by Department data
      .addCase(fetchLeaveByDepartment.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchLeaveByDepartment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.leaveByDepartment = action.payload;
      })
      .addCase(fetchLeaveByDepartment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for Expenses by Category data
      .addCase(fetchExpensesByCategory.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchExpensesByCategory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.expensesByCategory = action.payload;
      })
      .addCase(fetchExpensesByCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default reportSlice.reducer;