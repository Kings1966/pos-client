// client/src/components/Refund/RefundHistory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RefundHistory = () => {
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const res = await axios.get(`https://pos-backend-7gom.onrender.com/refunds`);
        setRefunds(res.data);
      } catch (err) {
        console.error('Failed to fetch refunds:', err);
      }
    };

    fetchRefunds();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 font-cinzel text-[#4169E1]">Refund History</h2>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-gradient-to-r from-[#4169E1] to-[#6A0DAD] text-white">
            <tr>
              <th className="p-3 font-cinzel">Invoice ID</th>
              <th className="p-3 font-cinzel">Customer</th>
              <th className="p-3 font-cinzel">Method</th>
              <th className="p-3 font-cinzel">Total Refunded</th>
              <th className="p-3 font-cinzel">Reason</th>
              <th className="p-3 font-cinzel">Date</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-3 text-center text-gray-500">
                  No refunds found.
                </td>
              </tr>
            ) : (
              refunds.map((r) => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{r.invoiceId}</td>
                  <td className="p-3">{r.customer?.name || 'N/A'}</td>
                  <td className="p-3 capitalize">{r.refundMethod}</td>
                  <td className="p-3">R{r.total.toFixed(2)}</td>
                  <td className="p-3">{r.reason || 'N/A'}</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RefundHistory;