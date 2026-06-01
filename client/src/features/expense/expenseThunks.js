import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorExtractor';

// --- For the Employee's View ---

export const fetchMyExpenses = createAsyncThunk('expense/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/expenses/my-expenses');
    return data.data;
  } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
  }
});

export const submitExpense = createAsyncThunk('expense/submit', async (expenseData, { dispatch, rejectWithValue }) => {
  try {
    await api.post('/expenses', expenseData);
    dispatch(fetchMyExpenses()); // Refresh the user's personal list after submitting
  } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
  }
});


// --- For the Manager's View ---

export const fetchTeamExpenses = createAsyncThunk('expense/fetchTeam', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/expenses/team-expenses');
    return data.data;
  } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
  }
});

// This version is specifically for managers to update their team's expenses.
export const updateTeamExpenseStatus = createAsyncThunk('expense/updateTeamStatus', async ({ expenseId, status }, { dispatch, rejectWithValue }) => {
  try {
    await api.put(`/expenses/${expenseId}/status`, { status });
    dispatch(fetchTeamExpenses()); // Refresh the team's list after action
  } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
  }
});


// --- For the Admin's Global View ---

export const fetchAllSystemExpenses = createAsyncThunk('expense/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/expenses/all');
    return data.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

// This version is specifically for admins to update ANY expense.
export const adminUpdateExpenseStatus = createAsyncThunk('expense/adminUpdateStatus', async ({ expenseId, status }, { dispatch, rejectWithValue }) => {
  try {
    await api.put(`/expenses/${expenseId}/status`, { status });
    dispatch(fetchAllSystemExpenses()); // Refresh the GLOBAL list after action
  } catch (error) {
      return rejectWithValue(extractErrorMessage(error));
  }
});