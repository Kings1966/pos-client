// client/src/components/Reports/Reports.js
import React, { useEffect, useState } from 'react';
import { Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, TextField, MenuItem, Select, FormControl, InputLabel, Box, Button, Pagination } from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [sortField, setSortField] = useState('date'); // New: Sort field (date or total)
  const [sortDirection, setSortDirection] = useState('desc'); // New: Sort direction (asc or desc)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const transactionResponse = await fetch(`https://pos-backend.onrender.com/api/transactions?page=${page}&limit=10`);
        if (!transactionResponse.ok) {
          throw new Error(`Failed to fetch transactions: ${transactionResponse.status} ${transactionResponse.statusText}`);
        }
        const transactionData = await transactionResponse.json();
        console.log('Fetched transactions:', transactionData);
        setTransactions(transactionData.transactions || []);
        setTotalPages(transactionData.pages || 1);
        setTotalTransactions(transactionData.total || 0);

        const productResponse = await fetch('https://pos-backend.onrender.com/api/products');
        if (!productResponse.ok) {
          throw new Error(`Failed to fetch products: ${productResponse.status} ${productResponse.statusText}`);
        }
        const productData = await productResponse.json();
        console.log('Fetched products for filter:', productData);
        setProducts(productData);

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [page]);

  useEffect(() => {
    let filtered = transactions;

    // Apply filters
    if (startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(startDate));
    }
    if (endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(endDate));
    }
    if (paymentTypeFilter) {
      filtered = filtered.filter(t => t.paymentType === paymentTypeFilter);
    }
    if (productFilter) {
      filtered = filtered.filter(t =>
        t.items.some(item => item.id === productFilter)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'total') {
        return sortDirection === 'asc' ? a.total - b.total : b.total - a.total;
      }
      return 0;
    });

    setFilteredTransactions(filtered);
  }, [startDate, endDate, paymentTypeFilter, productFilter, transactions, sortField, sortDirection]);

  // Daily Sales Chart
  const dailySalesData = {
    labels: filteredTransactions.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: filteredTransactions.map(t => t.total),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dailySalesOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Daily Sales' },
    },
  };

  // Top-Selling Products Chart
  const topProducts = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      if (topProducts[item.id]) {
        topProducts[item.id].quantity += item.quantity;
      } else {
        topProducts[item.id] = {
          name: item.name,
          quantity: item.quantity,
        };
      }
    });
  });

  const topProductsData = {
    labels: Object.values(topProducts).map(p => p.name),
    datasets: [
      {
        label: 'Quantity Sold',
        data: Object.values(topProducts).map(p => p.quantity),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      },
    ],
  };

  const topProductsOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Top-Selling Products' },
    },
  };

  // New: Sales by Payment Type Chart
  const salesByPaymentType = transactions.reduce((acc, t) => {
    const paymentType = t.paymentType || 'Unknown';
    acc[paymentType] = (acc[paymentType] || 0) + t.total;
    return acc;
  }, {});

  const salesByPaymentTypeData = {
    labels: Object.keys(salesByPaymentType),
    datasets: [
      {
        label: 'Total Sales ($)',
        data: Object.values(salesByPaymentType),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  };

  const salesByPaymentTypeOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Sales by Payment Type' },
    },
  };

  const handleExport = async () => {
    try {
      const response = await fetch('https://pos-backend.onrender.com/api/transactions/export');
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'transactions.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions');
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>Sales Reports</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Payment Type</InputLabel>
          <Select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value)}
            label="Payment Type"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="card">Card</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Product</InputLabel>
          <Select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            label="Product"
          >
            <MenuItem value="">All</MenuItem>
            {products.map(product => (
              <MenuItem key={product.id} value={product.id}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            label="Sort By"
          >
            <MenuItem value="date">Date</MenuItem>
            <MenuItem value="total">Total</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Sort Direction</InputLabel>
          <Select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
            label="Sort Direction"
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={handleExport}>
          Export to Excel
        </Button>
      </Box>
      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredTransactions.length === 0 ? (
        <Typography>No transactions match the selected filters.</Typography>
      ) : (
        <>
          <div style={{ marginBottom: '40px' }}>
            <Bar data={dailySalesData} options={dailySalesOptions} />
          </div>
          <div style={{ marginBottom: '40px' }}>
            <Bar data={topProductsData} options={topProductsOptions} />
          </div>
          <div style={{ marginBottom: '40px' }}>
            <Bar data={salesByPaymentTypeData} options={salesByPaymentTypeOptions} />
          </div>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Payment Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                    <TableCell>
                      {transaction.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}
                    </TableCell>
                    <TableCell>${transaction.total.toFixed(2)}</TableCell>
                    <TableCell>${transaction.discount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.paymentType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 1 }}>
            Showing {filteredTransactions.length} of {totalTransactions} transactions
          </Typography>
        </>
      )}
    </div>
  );
};

export default Reports;