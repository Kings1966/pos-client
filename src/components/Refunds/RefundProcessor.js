// client/src/components/Refunds/RefundProcessor.js
import React, { useState } from 'react';
import axios from 'axios';

const RefundProcessor = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [refundMethod, setRefundMethod] = useState('cash');

  const searchInvoice = async () => {
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/invoices/${invoiceNumber}`);
      setInvoice(res.data);
      setSelectedItems({});
    } catch (err) {
      console.error('Invoice not found:', err);
      alert('Invoice not found');
    }
  };

  const toggleItem = (itemId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: prev[itemId] ? null : 1,
    }));
  };

  const processRefund = async () => {
    try {
      const refundItems = Object.entries(selectedItems)
        .filter(([_, qty]) => qty)
        .map(([id, qty]) => ({ id, quantity: qty }));

      await axios.post(`${process.env.REACT_APP_API_URL}/refunds`, {
        invoiceId: invoice._id,
        items: refundItems,
        method: refundMethod,
      });

      alert('Refund processed successfully');
      setInvoice(null);
      setSelectedItems({});
    } catch (err) {
      console.error('Failed to process refund:', err);
      alert('Refund failed');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Process a Refund</h2>

      <input
        type="text"
        placeholder="Enter invoice number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        className="p-2 border rounded mb-2 w-full"
      />
      <button onClick={searchInvoice} className="bg-blue-500 text-white px-4 py-2 rounded mb-4">Search</button>

      {invoice && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Invoice: {invoice.number}</h3>
          <ul>
            {invoice.items.map((item) => (
              <li key={item._id} className="flex justify-between border-b py-2">
                <span>{item.name} (x{item.quantity})</span>
                <input
                  type="number"
                  min="0"
                  max={item.quantity}
                  value={selectedItems[item._id] || ''}
                  onChange={(e) =>
                    setSelectedItems((prev) => ({ ...prev, [item._id]: Number(e.target.value) }))
                  }
                  className="w-16 p-1 border rounded"
                />
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <label className="block mb-2">Refund Method</label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="p-2 border rounded w-full"
            >
              <option value="cash">Cash</option>
              <option value="store-credit">Store Credit</option>
              <option value="eft">EFT</option>
            </select>
          </div>

          <button onClick={processRefund} className="bg-green-600 text-white px-4 py-2 mt-4 rounded w-full">
            Process Refund
          </button>
        </div>
      )}
    </div>
  );
};

export default RefundProcessor;
