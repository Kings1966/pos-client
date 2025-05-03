// client/src/redux/posSlice.js
import { createSlice } from '@reduxjs/toolkit';

const posSlice = createSlice({
  name: 'pos',
  initialState: {
    status: 'idle',
  },
  reducers: {
    setStatus: (state, action) => {
      state.status = action.payload;
    },
  },
});

export const { setStatus } = posSlice.actions;
export default posSlice.reducer;