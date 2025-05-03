// client/src/components/Customer/Customer.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Customer = () => {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchCustomers = async () => {
    const res = await axios.get('https://pos-backend.onrender.com/api/customers');
    setCustomers(res.data);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await axios.get(`https://pos-backend.onrender.com/api/customers`);
        setCustomers(response.data);
      } catch (err) {
        console.error('Error fetching customers:', err);
      }
    };
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`https://pos-backend.onrender.com/api/customers/${editingId}`, form);
    } else {
      await axios.post('https://pos-backend.onrender.com/api/customers', form);
    }
    setForm({ name: '', phone: '', email: '', address: '' });
    setEditingId(null);
    fetchCustomers();
  };

  const handleDelete = async (id) => {
    await axios.delete(`https://pos-backend.onrender.com/api/customers/${id}`);
    fetchCustomers();
  };

  const handleEdit = (customer) => {
    setForm(customer);
    setEditingId(customer._id);
  };

  return (
    <div>
      <h2>Customer Management</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <button type="submit">{editingId ? 'Update' : 'Add'} Customer</button>
      </form>
      <ul>
        {customers.map((cust) => (
          <li key={cust._id}>
            {cust.name} - {cust.phone} - {cust.email}
            <button onClick={() => handleEdit(cust)}>Edit</button>
            <button onClick={() => handleDelete(cust._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Customer;
