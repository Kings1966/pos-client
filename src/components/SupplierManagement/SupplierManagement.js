// File: client/src/components/Supplier/Supplier.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [editingId, setEditingId] = useState(null);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get('https://pos-backend.onrender.com/api/suppliers');
      setSuppliers(res.data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await axios.put(`https://pos-backend.onrender.com/api/suppliers/${editingId}`, formData);
      } else {
        await axios.post('https://pos-backend.onrender.com/api/suppliers', formData);
      }
      setFormData({ name: '', phone: '', email: '', address: '' });
      setEditingId(null);
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
    }
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://pos-backend.onrender.com/api/suppliers/${id}`);
      fetchSuppliers();
    } catch (err) {
      console.error('Failed to delete supplier:', err);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5">Supplier Management</Typography>

      <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="Name" name="name" value={formData.name} onChange={handleChange} />
        <TextField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
        <TextField label="Email" name="email" value={formData.email} onChange={handleChange} />
        <TextField label="Address" name="address" value={formData.address} onChange={handleChange} />
        <Button variant="contained" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Supplier</Button>
      </Box>

      <Paper sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.address}</TableCell>
                <TableCell>
                  <Button onClick={() => handleEdit(s)}>Edit</Button>
                  <Button color="error" onClick={() => handleDelete(s._id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Supplier;
