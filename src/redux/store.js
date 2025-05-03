import { configureStore } from '@reduxjs/toolkit';
import posReducer from './posSlice';
import dashboardReducer from './dashboardSlice';
import cartReducer from './cartSlice';
import stockReducer from './stockSlice'; // ⬅️ Add this line

export const store = configureStore({
  reducer: {
    pos: posReducer,
    dashboard: dashboardReducer,
    cart: cartReducer,
    stock: stockReducer, // ⬅️ Add this line
  },
});
