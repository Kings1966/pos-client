// client/src/components/Refund/RefundProcess.js
import React, { useState } from 'react';
import axios from 'axios';

const RefundProcess = () => {
  const [invoiceId, setInvoiceId] = useState('');
  const [saleData, setSaleData] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: quantity }
  const [refundMethod, setRefundMethod] = useState('cash');
  const [reason, setReason] = useState('');

  const fetchSale = async () => {
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/sales/${invoiceId}`);
      setSaleData(res.data);
      setSelectedItems({});
    } catch (err) {
      console.error('Failed to fetch sale:', err);
      alert('Sale not found');
    }
  };

  const handleQuantityChange = (itemId, maxQuantity, value) => {
    const quantity = Math.max(0, Math.min(maxQuantity, Number(value))); // Ensure quantity is between 0 and max
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: quantity > 0 ? quantity : undefined, // Remove if quantity is 0
    }));
  };

  const calculateRefundTotal = () => {
    if (!saleData) return 0;
    return Object.entries(selectedItems).reduce((total, [itemId, qty]) => {
      if (!qty) return total;
      const item = saleData.items.find((i) => i._id === itemId);
      return total + (item ? item.price * qty : 0);
    }, 0);
  };

  const handleSubmitRefund = async () => {
    try {
      const refundItems = Object.entries(selectedItems)
        .filter(([_, qty]) => qty)
        .map(([itemId, qty]) => {
          const item = saleData.items.find((i) => i._id === itemId);
          return {
            productId: item.productId._id,
            quantity: qty,
            amount: item.price * qty,
          };
        });

      if (refundItems.length === 0) {
        alert('Please select at least one item to refund.');
        return;
      }

      const total = calculateRefundTotal();

      const payload = {
        invoiceId: saleData._id,
        customer: saleData.customer._id,
        items: refundItems,
        refundMethod,
        total,
        reason,
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/refunds`, payload);
      alert('Refund processed successfully');
      setInvoiceId('');
      setSaleData(null);
      setSelectedItems({});
      setRefundMethod('cash');
      setReason('');
    } catch (err) {
      console.error('Refund failed:', err);
      alert('Refund failed');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 font-cinzel text-[#4169E1]">Refund Processing</h2>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <input
          type="text"
          placeholder="Enter Invoice ID"
          value={invoiceId}
          onChange={(e) => setInvoiceId(e.target.value)}
          className="w-full p-2 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
        />
        <button
          onClick={fetchSale}
          className="bg-[#4169E1] text-white px-4 py-2 rounded-lg hover:bg-[#6A0DAD] transition-colors"
        >
          Search Invoice
        </button>
      </div>

      {saleData && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2 font-cinzel text-[#4169E1]">Invoice Items</h3>
          {saleData.items.map((item) => (
            <div key={item._id} className="flex justify-between items-center border-b py-2">
              <div>
                <p className="font-semibold">{item.productId.name}</p>
                <p className="text-sm text-gray-500">
                  Qty: {item.quantity} | Price: R{item.price.toFixed(2)} | Subtotal: R{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
              <input
                type="number"
                min="0"
                max={item.quantity}
                value={selectedItems[item._id] || ''}
                onChange={(e) => handleQuantityChange(item._id, item.quantity, e.target.value)}
                placeholder="Qty to refund"
                className="w-20 p-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>
          ))}

          <div className="mt-4 space-y-4">
            <div>
              <label className="block font-semibold text-gray-700">Refund Method:</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              >
                <option value="cash">Cash</option>
                <option value="eft">EFT</option>
                <option value="card">Card</option>
                <option value="store-credit">Store Credit</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700">Reason for Refund:</label>
              <textarea
                placeholder="Enter reason for refund"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
              />
            </div>

            <p className="font-bold text-lg text-[#FFD700]">
              Total to Refund: R{calculateRefundTotal().toFixed(2)}
            </p>

            <button
              onClick={handleSubmitRefund}
              className="w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Process Refund
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundProcess;