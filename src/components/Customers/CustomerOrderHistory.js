// client/src/components/Customers/CustomerOrderHistory.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CustomerOrderHistory = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`https://pos-backend-7gom.onrender.com/api/customers`);
        setCustomers(res.data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    if (!selectedCustomerId) return;
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/api/customers/${selectedCustomerId}/orders`);
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Customer Order History</h2>
      <select
        value={selectedCustomerId}
        onChange={(e) => setSelectedCustomerId(e.target.value)}
        className="p-2 border rounded mb-4"
      >
        <option value="">Select Customer</option>
        {customers.map((cust) => (
          <option key={cust._id} value={cust._id}>{cust.name}</option>
        ))}
      </select>

      <button
        onClick={fetchOrders}
        className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
      >
        View Orders
      </button>

      {orders.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Orders</h3>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border px-4 py-2">Date</th>
                <th className="border px-4 py-2">Total</th>
                <th className="border px-4 py-2">Items</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={index}>
                  <td className="border px-4 py-2">{new Date(order.date).toLocaleString()}</td>
                  <td className="border px-4 py-2">R{order.total.toFixed(2)}</td>
                  <td className="border px-4 py-2">
                    {order.cart.map(item => `${item.name} x ${item.quantity}`).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerOrderHistory;
