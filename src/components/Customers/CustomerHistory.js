import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CustomerHistory = () => {
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/orders?customer=${customerName}`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Customer Sales History</h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter customer name"
          className="p-2 border rounded w-64"
        />
        <button onClick={fetchOrders} className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </div>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Items</th>
              <th className="p-2 border">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={idx} className="border">
                <td className="p-2 border">{new Date(order.date).toLocaleDateString()}</td>
                <td className="p-2 border">
                  {order.items.map((i, iidx) => (
                    <div key={iidx}>
                      {i.name} x{i.quantity}
                    </div>
                  ))}
                </td>
                <td className="p-2 border">R{order.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerHistory;
