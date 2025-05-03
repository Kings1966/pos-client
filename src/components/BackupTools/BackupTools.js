import React, { useState } from 'react';
import { Button, Typography, Box, TextField } from '@mui/material';
import axios from 'axios';

const BackupTools = () => {
  const [restoreFilename, setRestoreFilename] = useState('');

  const handleBackup = () => {
    window.open('https://pos-backend.onrender.com/api/backup/export', '_blank');
  };

  const handleRestore = async () => {
    try {
      await axios.post('https://pos-backend.onrender.com/api/backup/restore', {
        filename: restoreFilename
      });
      alert('Restore complete!');
    } catch (err) {
      alert('Restore failed. Check filename.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset the database? This cannot be undone.')) {
      try {
        await axios.post('https://pos-backend.onrender.com/api/backup/reset');
        alert('Database reset successfully');
      } catch (err) {
        alert('Reset failed');
      }
    }
  };

  return (
    <Box sx={{ padding: '2rem' }}>
      <Typography variant="h4" gutterBottom>Backup Tools</Typography>
      <Button variant="contained" onClick={handleBackup} sx={{ mb: 2 }}>
        Download Backup
      </Button>

      <Typography variant="h6">Restore from Backup</Typography>
      <TextField
        label="Backup Filename"
        value={restoreFilename}
        onChange={(e) => setRestoreFilename(e.target.value)}
        sx={{ mr: 1, mt: 1 }}
        placeholder="e.g., backup-1683479901.json"
      />
      <Button variant="outlined" onClick={handleRestore} sx={{ mt: 1 }}>
        Restore
      </Button>

      <Box mt={4}>
        <Typography variant="h6">Reset Database</Typography>
        <Button variant="contained" color="error" onClick={handleReset}>
          Reset All Data
        </Button>
      </Box>
    </Box>
  );
};

export default BackupTools;
