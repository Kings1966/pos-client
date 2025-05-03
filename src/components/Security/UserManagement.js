// Full frontend panel to manage users & permissions
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from '@mui/material';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'cashier',
    permissions: {
      canAccessReports: false,
      canEditProducts: false,
      canManageUsers: false,
      canViewAccounting: false
    }
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [name]: checked }
    }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post('/api/users/register', form);
      setForm({
        username: '',
        password: '',
        role: 'cashier',
        permissions: {
          canAccessReports: false,
          canEditProducts: false,
          canManageUsers: false,
          canViewAccounting: false
        }
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>User Management</Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        <TextField label="Username" name="username" value={form.username} onChange={handleChange} />
        <TextField label="Password" name="password" value={form.password} onChange={handleChange} type="password" />

        <FormControl>
          <InputLabel>Role</InputLabel>
          <Select name="role" value={form.role} onChange={handleChange}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="cashier">Cashier</MenuItem>
          </Select>
        </FormControl>

        <Box>
          <FormControlLabel
            control={<Checkbox checked={form.permissions.canAccessReports} onChange={handlePermissionChange} name="canAccessReports" />}
            label="Access Reports"
          />
          <FormControlLabel
            control={<Checkbox checked={form.permissions.canEditProducts} onChange={handlePermissionChange} name="canEditProducts" />}
            label="Edit Products"
          />
          <FormControlLabel
            control={<Checkbox checked={form.permissions.canManageUsers} onChange={handlePermissionChange} name="canManageUsers" />}
            label="Manage Users"
          />
          <FormControlLabel
            control={<Checkbox checked={form.permissions.canViewAccounting} onChange={handlePermissionChange} name="canViewAccounting" />}
            label="View Accounting"
          />
        </Box>

        <Button variant="contained" onClick={handleSubmit}>Create User</Button>
      </Box>

      <Typography variant="h6">Existing Users</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Permissions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                {Object.entries(user.permissions).filter(([_, v]) => v).map(([k]) => k).join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default UserManagement;
