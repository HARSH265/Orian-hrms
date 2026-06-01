import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// --- Thunks for the Global Skill Library (Admin Page) ---
export const fetchAllSkills = createAsyncThunk('skill/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/skills'); return data.data; }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const createSkill = createAsyncThunk('skill/create', async (skillData, { dispatch, rejectWithValue }) => {
  try { await api.post('/skills', skillData); dispatch(fetchAllSkills()); }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const updateSkill = createAsyncThunk('skill/update', async ({ skillId, skillData }, { dispatch, rejectWithValue }) => {
  try { await api.put(`/skills/${skillId}`, skillData); dispatch(fetchAllSkills()); }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const archiveSkill = createAsyncThunk('skill/archive', async (skillId, { dispatch, rejectWithValue }) => {
  try { await api.delete(`/skills/${skillId}`); dispatch(fetchAllSkills()); }
  catch (error) { return rejectWithValue(error.response?.data?.message); }
});

// --- Thunks for an Individual User's Skill Profile ---
export const addSkillToProfile = createAsyncThunk('skill/addToProfile', async ({ skillId, proficiency }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/users/profile/skills', { skillId, proficiency });
    return data.data; // Returns the updated skills array for the user
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});

export const removeSkillFromProfile = createAsyncThunk('skill/removeFromProfile', async (skillId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/users/profile/skills/${skillId}`);
    return data.data;
  } catch (error) { return rejectWithValue(error.response?.data?.message); }
});