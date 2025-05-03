import React from 'react';

const CustomerSelector = ({ selectedCustomer, onCustomerSelect }) => {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-bold mb-2">Customer</h2>
      <input
        type="text"
        value={selectedCustomer}
        onChange={(e) => onCustomerSelect(e.target.value)}
        placeholder="Enter customer name"
        className="w-full p-2 border rounded"
      />
      {/* Optionally, add a dropdown for dynamic customers later */}
    </div>
  );
};

export default CustomerSelector;