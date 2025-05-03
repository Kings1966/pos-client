import React from 'react';

const DiscountField = ({ discount, setDiscount }) => {
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">Discount (%):</label>
      <input
        type="number"
        min="0"
        max="100"
        value={discount}
        onChange={(e) => setDiscount(Number(e.target.value))}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Enter discount percentage"
      />
    </div>
  );
};

export default DiscountField;