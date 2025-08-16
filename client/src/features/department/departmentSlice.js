import { createSlice } from '@reduxjs/toolkit';
import { 
    fetchAllDepartments, 
    createDepartment, 
    updateDepartment, 
    deleteDepartment 
} from './departmentThunks';

const initialState = {
  departments: [],
  status: 'idle',
  error: null,
};

// A helper function to handle pending, fulfilled, and rejected states
const createAsyncReducers = (builder, thunk) => {
    builder
        .addCase(thunk.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(thunk.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
};

const departmentSlice = createSlice({
  name: 'department',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Handle fetching all departments
    builder
        .addCase(fetchAllDepartments.pending, (state) => {
            state.status = 'loading';
        })
        .addCase(fetchAllDepartments.fulfilled, (state, action) => {
            state.status = 'succeeded';
            state.departments = action.payload;
        })
        .addCase(fetchAllDepartments.rejected, (state, action) => {
            state.status = 'failed';
            state.error = action.payload;
        });
        
    // Handle create, update, delete states
    // Since they all just reload the list, we can simplify their logic
    createAsyncReducers(builder, createDepartment);
    createAsyncReducers(builder, updateDepartment);
    createAsyncReducers(builder, deleteDepartment);

    // After a successful CUD operation, just reset status. The list is re-fetched.
    const successfulCud = (state) => { state.status = 'succeeded'; };
    builder.addCase(createDepartment.fulfilled, successfulCud);
    builder.addCase(updateDepartment.fulfilled, successfulCud);
    builder.addCase(deleteDepartment.fulfilled, successfulCud);
  },
});

export default departmentSlice.reducer;