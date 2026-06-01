import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// For Admin: Fetch all surveys created
export const fetchAllSurveys = createAsyncThunk(
  'survey/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/surveys');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Admin: Create a new survey
export const createSurvey = createAsyncThunk(
  'survey/create',
  async (surveyData, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await api.post('/surveys', surveyData);
      dispatch(fetchAllSurveys()); // Refresh the list after creation
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For User: Fetch surveys assigned to them
export const fetchMyAssignedSurveys = createAsyncThunk(
  'survey/fetchMyAssigned',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/surveys/my-surveys');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For User/Admin: Fetch a single survey to view or take
export const fetchSurveyById = createAsyncThunk(
  'survey/fetchById',
  async (surveyId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/surveys/${surveyId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For User: Submit their response to a survey
export const submitSurveyResponse = createAsyncThunk(
  'survey/submitResponse',
  async ({ surveyId, answers }, { dispatch, rejectWithValue }) => {
    try {
      await api.post(`/surveys/${surveyId}/responses`, { answers });
      dispatch(fetchMyAssignedSurveys()); // Refresh their list of pending surveys
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

// For Admin: Fetch aggregated results for a survey
export const fetchSurveyResults = createAsyncThunk(
  'survey/fetchResults',
  async (surveyId, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/surveys/${surveyId}/results`);
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const updateSurvey = createAsyncThunk(
  'survey/update',
  async ({ surveyId, surveyData }, { dispatch, rejectWithValue }) => {
    try {
      await api.put(`/surveys/${surveyId}`, surveyData);
      dispatch(fetchAllSurveys()); // Refresh list to show changes
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);

export const closeSurvey = createAsyncThunk(
  'survey/close',
  async (surveyId, { dispatch, rejectWithValue }) => {
    try {
      // We use the DELETE http verb which maps to our soft-delete controller
      await api.delete(`/surveys/${surveyId}`);
      dispatch(fetchAllSurveys()); // Refresh the list
    } catch (error) {
      return rejectWithValue(error.response?.data?.message);
    }
  }
);