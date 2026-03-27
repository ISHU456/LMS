import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import resultReducer from '../features/results/resultSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    results: resultReducer,
  },
});
