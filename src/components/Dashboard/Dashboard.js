// client/src/components/Dashboard/Dashboard.js
import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import './Dashboard.css';

const Dashboard = () => {
  const widgets = [
    { id: 1, title: 'Sales', content: 'Total Sales: $500' },
    { id: 2, title: 'Inventory', content: 'Items in Stock: 150' },
  ];

  return (
    <Box sx={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <div style={{ display: 'flex', gap: '20px' }}>
        {widgets.map((widget) => (
          <Paper
            key={widget.id}
            elevation={3}
            style={{
              width: '200px',
              padding: '10px',
            }}
          >
            <Typography variant="h6">{widget.title}</Typography>
            <Typography>{widget.content}</Typography>
          </Paper>
        ))}
      </div>
    </Box>
  );
};

export default Dashboard;