import { createSlice } from '@reduxjs/toolkit';
// Import all of the thunks related to the expense feature
import { 
    fetchMyExpenses, 
    submitExpense,
    fetchTeamExpenses,
    updateTeamExpenseStatus,  // The correctly named thunk for managers
    fetchAllSystemExpenses, // The new thunk for the admin view
    adminUpdateExpenseStatus // The new thunk for admin actions
} from './expenseThunks';

// This is the complete state shape for this slice
const initialState = {
  myExpenses: [],       // For the employee's personal view
  teamExpenses: [],     // For the manager's team view
  allExpenses: [],      // For the global admin view
  status: 'idle',       // Tracks the loading status ('idle' | 'loading' | 'succeeded' | 'failed')
  error: null,
};

const expenseSlice = createSlice({
  name: 'expense',
  initialState,
  reducers: {}, // No synchronous reducers needed for this slice
  extraReducers: (builder) => {
    builder
      // --- Cases for Employee's "My Expenses" View ---
      .addCase(fetchMyExpenses.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myExpenses = action.payload;
      })
      .addCase(fetchMyExpenses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Cases for Manager's "Team Expenses" View ---
      .addCase(fetchTeamExpenses.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchTeamExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.teamExpenses = action.payload;
      })
      .addCase(fetchTeamExpenses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // --- Cases for Admin's "All Expenses" View ---
      .addCase(fetchAllSystemExpenses.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllSystemExpenses.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allExpenses = action.payload;
      })
      .addCase(fetchAllSystemExpenses.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      // --- Generic Matchers for Actions (Create, Update) ---
      // These handle the loading/success/fail states for any action that modifies data.
      .addMatcher(
        (action) => [submitExpense.pending, updateTeamExpenseStatus.pending, adminUpdateExpenseStatus.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [submitExpense.fulfilled, updateTeamExpenseStatus.fulfilled, adminUpdateExpenseStatus.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        (action) => [submitExpense.rejected, updateTeamExpenseStatus.rejected, adminUpdateExpenseStatus.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default expenseSlice.reducer;