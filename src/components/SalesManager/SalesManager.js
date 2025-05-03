import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SalesManager = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await axios.get('https://pos-backend-7gom.onrender.com/api/transactions');
      setSales(res.data.transactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const filtered = sales.filter(s =>
    s.items.some(i => i.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Sales Manager</h2>
      <input
        placeholder="Search by product name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '1rem' }}
      />
      <ul>
        {filtered.map((t, idx) => (
          <li key={idx} style={{ marginBottom: '1rem' }}>
            <strong>{new Date(t.date).toLocaleString()}</strong><br />
            Items: {t.items.map(i => `${i.name} x${i.quantity}`).join(', ')}<br />
            Total: ${t.total.toFixed(2)} | Payment: {t.paymentType}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesManager;
