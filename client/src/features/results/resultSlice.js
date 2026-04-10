import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import resultService from './resultService';

const initialState = {
  results: [],
  studentResults: { results: [], sgpa: 0, totalCredits: 0 },
  analytics: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

// Get students for mark entry
export const getStudentsForEntry = createAsyncThunk(
  'results/getStudents',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.getStudentsForEntry(params, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Save results
export const saveMarks = createAsyncThunk(
  'results/save',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.saveMarks(data, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Submit for approval
export const submitMarksForApproval = createAsyncThunk(
  'results/submit',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.submitMarks(data, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Approve marks
export const approveMarks = createAsyncThunk(
  'results/approve',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.approveMarks(data, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Publish results
export const publishMarks = createAsyncThunk(
  'results/publish',
  async (data, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.publishMarks(data, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get student's my results
export const getMyResults = createAsyncThunk(
  'results/getMyResults',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.getMyResults(token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get analytics
export const getAnalytics = createAsyncThunk(
  'results/getAnalytics',
  async (params, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await resultService.getAnalytics(params, token);
    } catch (error) {
      const message = error.response?.data?.message || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const resultSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudentsForEntry.pending, (state) => { state.isLoading = true; })
      .addCase(getStudentsForEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const rawData = Array.isArray(action.payload) ? action.payload : (action.payload.students || []);
        state.results = rawData.map(s => ({
          ...s,
          resultId: s.existingResult?._id || null,
          isLocked: s.existingResult?.isLocked || false,
          status: s.existingResult?.status || 'draft'
        }));
      })
      .addCase(getStudentsForEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getMyResults.fulfilled, (state, action) => {
        state.isLoading = false;
        state.studentResults = action.payload;
      })
      .addCase(getAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.analytics = action.payload;
      })
      .addCase(saveMarks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updatedSaved = action.payload.results || [];
        if (!Array.isArray(state.results)) return;
        state.results = state.results.map(student => {
          const match = updatedSaved.find(r => r.student && (r.student.toString() === student._id.toString()));
          if (match) {
            return {
              ...student,
              marks: match.marks,
              isLocked: match.isLocked,
              status: match.status,
              resultId: match._id,
              grade: match.grade,
              totalMarks: match.totalMarks
            };
          }
          return student;
        });
      })
      .addCase(submitMarksForApproval.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.results = state.results.map(student => ({
          ...student,
          status: 'submitted',
          isLocked: true
        }));
      })
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => { state.isLoading = true; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'),
        (state) => { state.isLoading = false; }
      );
  },
});

export const { reset } = resultSlice.actions;
export default resultSlice.reducer;
