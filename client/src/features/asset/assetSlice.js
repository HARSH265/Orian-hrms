import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchAllAssets, 
    createAsset, 
    updateAsset, 
    deleteAsset,
    fetchMyAssets
} from './assetThunks';

const initialState = {
  allAssets: [],      // For the admin view
  myAssets: [],       // For the employee's view
  status: 'idle',
  error: null,
};

const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Cases for fetching all assets (admin)
      .addCase(fetchAllAssets.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchAllAssets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.allAssets = action.payload;
      })
      .addCase(fetchAllAssets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cases for fetching my assets (employee)
      .addCase(fetchMyAssets.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyAssets.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.myAssets = action.payload;
      })
      .addCase(fetchMyAssets.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Generic cases for CUD operations
      .addMatcher(
        (action) => [createAsset.pending, updateAsset.pending, deleteAsset.pending].includes(action.type),
        (state) => { state.status = 'loading'; }
      )
      .addMatcher(
        (action) => [createAsset.fulfilled, updateAsset.fulfilled, deleteAsset.fulfilled].includes(action.type),
        (state) => { state.status = 'succeeded'; }
      )
      .addMatcher(
        (action) => [createAsset.rejected, updateAsset.rejected, deleteAsset.rejected].includes(action.type),
        (state, action) => {
          state.status = 'failed';
          state.error = action.payload;
        }
      );
  },
});

export default assetSlice.reducer;