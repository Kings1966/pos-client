// client/src/components/Accounting/Accounting.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

const Accounting = () => {
  const [transactions, setTransactions] = useState([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [accountDebit, setAccountDebit] = useState('');
  const [accountCredit, setAccountCredit] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const chartOfAccounts = [
    { id: 1, name: 'Cash' },
    { id: 2, name: 'Petty Cash' },
    { id: 3, name: 'Bank Account' },
    { id: 4, name: 'Accounts Payable' },
    { id: 5, name: 'Sales Revenue' },
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://pos-backend.onrender.com/api/accounting/transactions');
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const data = await response.json();
        setTransactions(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const handleAddTransaction = async () => {
    if (!description || !amount || !accountDebit || !accountCredit) {
      alert('Please fill in all fields');
      return;
    }

    const newTransaction = {
      description,
      amount: parseFloat(amount),
      debit: accountDebit,
      credit: accountCredit,
      date: new Date().toISOString(),
    };

    try {
      const response = await fetch('https://pos-backend-7gom.onrender.com/api/accounting/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTransaction),
      });
      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }
      const savedTransaction = await response.json();
      setTransactions([...transactions, savedTransaction]);
      setDescription('');
      setAmount('');
      setAccountDebit('');
      setAccountCredit('');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    }
  };

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Accounting</Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">Add Transaction</Typography>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mr: 1, mt: 1 }}
        />
        <TextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          sx={{ mr: 1, mt: 1 }}
        />
        <FormControl sx={{ minWidth: 120, mr: 1, mt: 1 }}>
          <InputLabel>Debit Account</InputLabel>
          <Select
            value={accountDebit}
            onChange={(e) => setAccountDebit(e.target.value)}
            label="Debit Account"
          >
            <MenuItem value="">Select</MenuItem>
            {chartOfAccounts.map((account) => (
              <MenuItem key={account.id} value={account.name}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120, mr: 1, mt: 1 }}>
          <InputLabel>Credit Account</InputLabel>
          <Select
            value={accountCredit}
            onChange={(e) => setAccountCredit(e.target.value)}
            label="Credit Account"
          >
            <MenuItem value="">Select</MenuItem>
            {chartOfAccounts.map((account) => (
              <MenuItem key={account.id} value={account.name}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleAddTransaction}
          sx={{ mt: 1 }}
        >
          Add Transaction
        </Button>
      </Box>
      <Typography variant="h6">Transaction Ledger</Typography>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : transactions.length === 0 ? (
        <Typography>No transactions available.</Typography>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Debit Account</TableCell>
              <TableCell>Credit Account</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.debit}</TableCell>
                <TableCell>{transaction.credit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
};

export default Accounting;