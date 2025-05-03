import React from 'react';

const PaymentSection = ({
  cartItems = [],
  selectedCustomer,
  discount,
  setDiscount,
  paymentMethod,
  setPaymentMethod,
  onCompletePayment,
}) => {
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const total = subtotal - (subtotal * discount) / 100;

  return (
    <div className="mt-4">
      <div className="mb-2">
        <label className="block font-semibold mb-1">Discount (%)</label>
        <input
          type="number"
          min="0"
          max="100"
          className="w-full p-2 border rounded"
          value={discount}
          onChange={(e) => setDiscount(Number(e.target.value))}
        />
      </div>

      <div className="mb-2">
        <label className="block font-semibold mb-1">Payment Method</label>
        <select
          className="w-full p-2 border rounded"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <option value="Cash">Cash</option>
          <option value="EFT">EFT</option>
          <option value="Card">Card</option>
        </select>
      </div>

      <div className="text-xl font-bold mb-2">Total: ${total.toFixed(2)}</div>

      <button
        onClick={onCompletePayment}
        className="w-full p-4 bg-green-500 text-white font-bold rounded disabled:bg-gray-400"
        disabled={cartItems.length === 0 || !selectedCustomer}
      >
        Complete Payment
      </button>
    </div>
  );
};

export default PaymentSection;