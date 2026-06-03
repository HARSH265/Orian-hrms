import { createSlice } from '@reduxjs/toolkit';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from './expenseCategoryThunks';

const initialState = {
  categories: [],
  status: 'idle',
  error: null,
};

const categorySlice = createSlice({
  name: 'expenseCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(createCategory.rejected, (state, action) => { state.error = action.payload; })
      .addCase(updateCategory.rejected, (state, action) => { state.error = action.payload; })
      .addCase(deleteCategory.rejected, (state, action) => { state.error = action.payload; });
  },
});

export default categorySlice.reducer;
