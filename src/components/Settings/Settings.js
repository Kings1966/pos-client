// client/src/components/Settings/MyCompany.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, TextField, Button, Paper, Grid
} from '@mui/material';

const MyCompany = () => {
  const [companyInfo, setCompanyInfo] = useState({
    name: '',
    address: '',
    vat: '',
    bank: '',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCompanyInfo = async () => {
      try {
        const res = await axios.get('https://pos-backend.onrender.com/api/company');
        if (res.data) {
          setCompanyInfo(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch company info', err);
      }
    };
    fetchCompanyInfo();
  }, []);

  const handleChange = (e) => {
    setCompanyInfo({ ...companyInfo, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.post('https://pos-backend.onrender.com/api/company', companyInfo);
      alert('Company info saved successfully.');
    } catch (err) {
      console.error('Error saving company info:', err);
      alert('Failed to save company info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        My Company Settings
      </Typography>
      <Paper elevation={2} sx={{ padding: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Company Name"
              name="name"
              value={companyInfo.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="VAT Number"
              name="vat"
              value={companyInfo.vat}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={companyInfo.address}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Bank Details"
              name="bank"
              value={companyInfo.bank}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Logo URL"
              name="logoUrl"
              value={companyInfo.logoUrl}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          sx={{ mt: 2 }}
          disabled={loading}
        >
          Save Settings
        </Button>
      </Paper>
    </Box>
  );
};

export default MyCompany;
