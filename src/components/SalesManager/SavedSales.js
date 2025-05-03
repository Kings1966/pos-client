import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { clearCart, addToCart } from '../../redux/cartSlice';
import { useNavigate } from 'react-router-dom';

const SavedSales = () => {
  const [savedSales, setSavedSales] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchSavedSales = async () => {
    try {
      const res = await axios.get(`https://pos-backend-7gom.onrender.com/api//saved-sales`);
      setSavedSales(res.data);
    } catch (err) {
      console.error('Failed to fetch saved sales', err);
    }
  };

  useEffect(() => {
    fetchSavedSales();
  }, []);

  const resumeSale = (sale) => {
    dispatch(clearCart());
    sale.items.forEach(item => dispatch(addToCart(item)));
    navigate('/');
  };

  const deleteSale = async (id) => {
    try {
      await axios.delete(`https://pos-backend-7gom.onrender.com/api//saved-sales/${id}`);
      fetchSavedSales();
    } catch (err) {
      console.error('Failed to delete saved sale', err);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Saved Sales</h2>
      {savedSales.length === 0 ? (
        <p>No saved sales.</p>
      ) : (
        <ul>
          {savedSales.map(sale => (
            <li key={sale._id} style={{ marginBottom: '1rem' }}>
              <strong>Customer:</strong> {sale.customer || 'Walk-in'} <br />
              <strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()} <br />
              <strong>Items:</strong> {sale.items.length}
              <br />
              <button onClick={() => resumeSale(sale)} style={{ marginRight: '1rem' }}>
                Resume Sale
              </button>
              <button onClick={() => deleteSale(sale._id)} style={{ color: 'red' }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SavedSales;
