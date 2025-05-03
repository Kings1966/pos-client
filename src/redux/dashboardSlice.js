// client/src/redux/dashboardSlice.js
import { createSlice } from '@reduxjs/toolkit';

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    metrics: {},
  },
  reducers: {
    setMetrics: (state, action) => {
      state.metrics = action.payload;
    },
  },
});

export const { setMetrics } = dashboardSlice.actions;
export default dashboardSlice.reducer;