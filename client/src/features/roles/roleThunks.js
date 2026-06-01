// In: client/src/features/roles/roleThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRoles = createAsyncThunk('roles/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.get('/roles');
        return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

// --- UPDATED: Now returns the new role for optimistic UI ---
export const createRole = createAsyncThunk('roles/create', async (roleData, { rejectWithValue }) => {
    try {
        const { data } = await api.post('/roles', roleData);
        return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

// --- UPDATED: Now returns the updated role for optimistic UI ---
export const updateRole = createAsyncThunk('roles/update',
  async ({ roleId, roleData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/roles/${roleId}`, roleData);
      return data.data;
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);

// --- UPDATED: Now returns the ID of the deleted role ---
export const deleteRole = createAsyncThunk('roles/delete',
  async (roleId, { rejectWithValue }) => {
    try {
      await api.delete(`/roles/${roleId}`);
      return roleId; // Return the ID for optimistic UI
    } catch (error) { return rejectWithValue(error.response?.data?.message); }
  }
);