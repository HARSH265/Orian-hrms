import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchMyExpenses, 
    submitExpense,
    fetchTeamExpenses,
    updateTeamExpenseStatus,
    fetchAllSystemExpenses,
    adminUpdateExpenseStatus
} from './expenseThunks';

const initialState = {
  myExpenses: [],
  teamExpenses: [],
  allExpenses: [],
  myStatus: 'idle',
  teamStatus: 'idle',
  allStatus: 'idle',
  actionStatus: 'idle',
  error: null,
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- My Expenses ---
      .addCase(fetchMyExpenses.pending, (state) => {
        state.myStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchMyExpenses.fulfilled, (state, action) => {
        state.myStatus = 'succeeded';
        state.myExpenses = action.payload;
      })
      .addCase(fetchMyExpenses.rejected, (state, action) => {
        state.myStatus = 'failed';
        state.error = action.payload;
      })
      // --- Team Expenses ---
      .addCase(fetchTeamExpenses.pending, (state) => {
        state.teamStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchTeamExpenses.fulfilled, (state, action) => {
        state.teamStatus = 'succeeded';
        state.teamExpenses = action.payload;
      })
      .addCase(fetchTeamExpenses.rejected, (state, action) => {
        state.teamStatus = 'failed';
        state.error = action.payload;
      })
      // --- All Expenses (Admin) ---
      .addCase(fetchAllSystemExpenses.pending, (state) => {
        state.allStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchAllSystemExpenses.fulfilled, (state, action) => {
        state.allStatus = 'succeeded';
        state.allExpenses = action.payload;
      })
      .addCase(fetchAllSystemExpenses.rejected, (state, action) => {
        state.allStatus = 'failed';
        state.error = action.payload;
      })
      // --- Mutating Actions ---
      .addCase(submitExpense.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(submitExpense.fulfilled, (state) => {
        state.actionStatus = 'succeeded';
        state.error = null;
      })
      .addCase(submitExpense.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(updateTeamExpenseStatus.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(updateTeamExpenseStatus.fulfilled, (state) => {
        state.actionStatus = 'succeeded';
        state.error = null;
      })
      .addCase(updateTeamExpenseStatus.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      })
      .addCase(adminUpdateExpenseStatus.pending, (state) => {
        state.actionStatus = 'loading';
        state.error = null;
      })
      .addCase(adminUpdateExpenseStatus.fulfilled, (state) => {
        state.actionStatus = 'succeeded';
        state.error = null;
      })
      .addCase(adminUpdateExpenseStatus.rejected, (state, action) => {
        state.actionStatus = 'failed';
        state.error = action.payload;
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer;