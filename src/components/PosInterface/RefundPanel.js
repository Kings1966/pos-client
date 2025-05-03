// client/src/components/PosInterface/RefundPanel.js
import React, { useState } from 'react';
import axios from 'axios';

const RefundPanel = () => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [saleData, setSaleData] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [refundMethod, setRefundMethod] = useState('cash');

  const fetchSale = async () => {
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/sales/invoice/${invoiceNumber}`);
      setSaleData(res.data);
    } catch (err) {
      console.error('Failed to fetch sale:', err);
    }
  };

  const toggleItem = (productId) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleRefund = async () => {
    try {
      const itemsToRefund = saleData.items.filter(item => selectedItems[item.productId]);
      const data = {
        invoiceNumber,
        items: itemsToRefund,
        method: refundMethod
      };
      await axios.post(`https://pos-backend-7gom.onrender.com/refunds`, data);
      alert('Refund processed successfully');
      setSaleData(null);
      setSelectedItems({});
    } catch (err) {
      console.error('Refund failed:', err);
      alert('Refund failed');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Refund Sale</h2>

      <input
        type="text"
        placeholder="Enter Invoice Number"
        value={invoiceNumber}
        onChange={(e) => setInvoiceNumber(e.target.value)}
        className="p-2 border rounded w-full mb-4"
      />
      <button onClick={fetchSale} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Fetch Sale</button>

      {saleData && (
        <div>
          <h3 className="font-semibold">Customer: {saleData.customer}</h3>
          <ul className="mt-2">
            {saleData.items.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>{item.name} - Qty: {item.quantity}</span>
                <input
                  type="checkbox"
                  checked={selectedItems[item.productId] || false}
                  onChange={() => toggleItem(item.productId)}
                />
              </li>
            ))}
          </ul>

          <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="mt-4 w-full p-2 border rounded">
            <option value="cash">Cash</option>
            <option value="store-credit">Store Credit</option>
            <option value="eft">EFT</option>
          </select>

          <button onClick={handleRefund} className="bg-green-600 text-white px-4 py-2 mt-4 rounded">Process Refund</button>
        </div>
      )}
    </div>
  );
};

export default RefundPanel;
