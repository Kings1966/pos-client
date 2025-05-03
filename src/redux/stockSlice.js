// client/src/redux/stockSlice.js
import { createSlice } from '@reduxjs/toolkit';

const stockSlice = createSlice({
  name: 'stock',
  initialState: {
    products: [],
  },
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
    },
    updateProduct: (state, action) => {
      const updated = action.payload;
      const index = state.products.findIndex(p => p.id === updated.id);
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...updated };
      } else {
        state.products.push(updated);
      }
    },
  },
});

export const { setProducts, updateProduct } = stockSlice.actions;
export default stockSlice.reducer;
