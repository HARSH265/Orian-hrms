import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { extractErrorMessage } from '../../utils/errorExtractor';

export const fetchCategories = createAsyncThunk('expenseCategories/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/expense-categories');
    return data.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const createCategory = createAsyncThunk('expenseCategories/create', async (categoryData, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.post('/expense-categories', categoryData);
    await dispatch(fetchCategories());
    return data.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const updateCategory = createAsyncThunk('expenseCategories/update', async ({ id, ...categoryData }, { dispatch, rejectWithValue }) => {
  try {
    const { data } = await api.put(`/expense-categories/${id}`, categoryData);
    await dispatch(fetchCategories());
    return data.data;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});

export const deleteCategory = createAsyncThunk('expenseCategories/delete', async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.delete(`/expense-categories/${id}`);
    await dispatch(fetchCategories());
    return id;
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error));
  }
});
