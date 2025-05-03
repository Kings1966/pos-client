import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RefundPage = () => {
  const [invoiceId, setInvoiceId] = useState('');
  const [saleData, setSaleData] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState('cash');
  const [reason, setReason] = useState('');

  const fetchSale = async () => {
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/sales/${invoiceId}`);
      setSaleData(res.data);
    } catch (err) {
      console.error('Failed to fetch sale:', err);
    }
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmitRefund = async () => {
    try {
      const refundItems = saleData.items
        .filter((item) => selectedItems.includes(item._id))
        .map((item) => ({
          productId: item.productId._id,
          quantity: item.quantity,
          amount: item.price * item.quantity,
        }));

      const total = refundItems.reduce((sum, i) => sum + i.amount, 0);

      const payload = {
        invoiceId: saleData._id,
        customer: saleData.customer._id,
        items: refundItems,
        refundMethod,
        total,
        reason
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/refunds`, payload);
      alert('Refund processed');
      setInvoiceId('');
      setSaleData(null);
      setSelectedItems([]);
      setRefundMethod('cash');
      setReason('');
    } catch (err) {
      console.error('Refund failed:', err);
      alert('Refund failed');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Refund Processing</h2>

      <input
        type="text"
        placeholder="Enter Invoice ID"
        value={invoiceId}
        onChange={(e) => setInvoiceId(e.target.value)}
        className="w-full p-2 border rounded mb-2"
      />
      <button onClick={fetchSale} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Search Invoice</button>

      {saleData && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-xl font-semibold mb-2">Items</h3>
          {saleData.items.map((item) => (
            <div key={item._id} className="flex justify-between items-center border-b py-2">
              <div>
                <p>{item.productId.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} | Price: R{item.price}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedItems.includes(item._id)}
                onChange={() => toggleItemSelection(item._id)}
              />
            </div>
          ))}

          <div className="mt-4">
            <label>Refund Method:</label>
            <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full p-2 border rounded mb-2">
              <option value="cash">Cash</option>
              <option value="eft">EFT</option>
              <option value="card">Card</option>
            </select>

            <textarea
              placeholder="Reason for refund"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />

            <button onClick={handleSubmitRefund} className="bg-green-600 text-white px-4 py-2 rounded w-full">Process Refund</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundPage;
