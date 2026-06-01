import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchAllSurveys, 
    fetchMyAssignedSurveys,
    fetchSurveyById,
    fetchSurveyResults,
    createSurvey,
    submitSurveyResponse,
    closeSurvey,
     updateSurvey,
} from './surveyThunks';

const initialState = {
  surveys: [], // For admin list
  mySurveys: [], // For user's "to-do" list
  currentSurvey: null, // For viewing, taking, or editing a survey
  surveyResults: null, // For viewing aggregated results
  status: 'idle',
  error: null,
};

const surveySlice = createSlice({
  name: 'survey',
  initialState,
  reducers: {
    clearCurrentSurvey: (state) => {
        state.currentSurvey = null;
        state.surveyResults = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Surveys (Admin)
      .addCase(fetchAllSurveys.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllSurveys.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.surveys = action.payload;
      })
      .addCase(fetchAllSurveys.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch My Assigned Surveys (User)
      .addCase(fetchMyAssignedSurveys.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyAssignedSurveys.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mySurveys = action.payload;
      })
      .addCase(fetchMyAssignedSurveys.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch Single Survey by ID
      .addCase(fetchSurveyById.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchSurveyById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentSurvey = action.payload;
      })
      .addCase(fetchSurveyById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
       // Fetch Survey Results
      .addCase(fetchSurveyResults.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchSurveyResults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.surveyResults = action.payload;
      })
      .addCase(fetchSurveyResults.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(closeSurvey.pending, (state) => { state.status = 'loading'; })
      .addCase(closeSurvey.fulfilled, (state) => { state.status = 'succeeded'; })
      .addCase(closeSurvey.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Handle generic loading/success/fail for mutations
     .addMatcher(
        // Add updateSurvey.pending here
        (action) => [createSurvey.pending, submitSurveyResponse.pending, updateSurvey.pending].includes(action.type),
        (state) => { state.status = 'loading'; state.error = null; }
      )
      .addMatcher(
        (action) => [createSurvey.fulfilled, submitSurveyResponse.fulfilled, updateSurvey.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      
      .addMatcher(
        (action) => [createSurvey.rejected, submitSurveyResponse.rejected, updateSurvey.rejected].includes(action.type),
        (state, action) => { state.status = 'failed'; state.error = action.payload; }
      );
  },
});

export const { clearCurrentSurvey } = surveySlice.actions;
export default surveySlice.reducer;