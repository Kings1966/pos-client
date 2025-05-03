import React, { useEffect, useState } from 'react';
import {
  Box, Typography, TextField, Button, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';

const TaxRates = () => {
  const [taxRates, setTaxRates] = useState([]);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchTaxRates = async () => {
    try {
      const res = await axios.get('https://pos-backend.onrender.com/api/tax-rates');
      setTaxRates(res.data);
    } catch (err) {
      console.error('Failed to fetch tax rates:', err);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const handleSubmit = async () => {
    if (!name || !rate) return alert('Name and rate required');
    const payload = { name, rate: parseFloat(rate) };

    try {
      if (editingId) {
        await axios.put(`https://pos-backend.onrender.com/api/tax-rates/${editingId}`, payload);
      } else {
        await axios.post('https://pos-backend.onrender.com/api/tax-rates', payload);
      }
      setName('');
      setRate('');
      setEditingId(null);
      fetchTaxRates();
    } catch (err) {
      console.error('Error saving tax rate:', err);
    }
  };

  const handleEdit = (tax) => {
    setEditingId(tax._id);
    setName(tax.name);
    setRate(tax.rate);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax rate?')) return;
    try {
      await axios.delete(`https://pos-backend.onrender.com/api/tax-rates/${id}`);
      fetchTaxRates();
    } catch (err) {
      console.error('Error deleting tax rate:', err);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>Tax Rates</Typography>

      <Box mb={3} display="flex" gap={2}>
        <TextField label="Tax Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Rate (%)" value={rate} onChange={(e) => setRate(e.target.value)} type="number" />
        <Button variant="contained" onClick={handleSubmit}>
          {editingId ? 'Update' : 'Add'}
        </Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Rate (%)</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {taxRates.map((tax) => (
            <TableRow key={tax._id}>
              <TableCell>{tax.name}</TableCell>
              <TableCell>{tax.rate}</TableCell>
              <TableCell align="right">
                <IconButton onClick={() => handleEdit(tax)}><Edit /></IconButton>
                <IconButton onClick={() => handleDelete(tax._id)}><Delete /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default TaxRates;
