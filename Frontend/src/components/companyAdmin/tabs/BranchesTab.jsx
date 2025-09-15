import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem } from '@mui/material';
import { getBranches, createBranch, getCompanyUsers, setUserBranch } from '../../../supabase/api';

export default function BranchesTab() {
  const [branches, setBranches] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [users, setUsers] = useState([]);
  const [assign, setAssign] = useState({ user_id: '', branch_id: '' });

  const load = async () => {
    const [b, u] = await Promise.all([getBranches(), getCompanyUsers()]);
    setBranches(b.data || []);
    setUsers(u.data || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name) return;
    await createBranch(name, location);
    setName(''); setLocation('');
    load();
  };

  const assignBranch = async () => {
    if (!assign.user_id || !assign.branch_id) return;
    await setUserBranch(assign.user_id, Number(assign.branch_id));
    setAssign({ user_id: '', branch_id: '' });
    load();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Branches</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Branch name" value={name} onChange={e => setName(e.target.value)} />
          <TextField label="Location" value={location} onChange={e => setLocation(e.target.value)} />
          <Button variant="contained" onClick={create}>Create</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(branches || []).map(b => (
              <TableRow key={b.branch_id}>
                <TableCell>{b.branch_id}</TableCell>
                <TableCell>{b.name}</TableCell>
                <TableCell>{b.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Assign Users to Branch</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Select displayEmpty value={assign.user_id} onChange={e => setAssign(a => ({ ...a, user_id: e.target.value }))} sx={{ minWidth: 240 }}>
            <MenuItem value="">Select User</MenuItem>
            {(users||[]).map(u => <MenuItem key={u.user_id} value={u.user_id}>{u.name} • {u.email}</MenuItem>)}
          </Select>
          <Select displayEmpty value={assign.branch_id} onChange={e => setAssign(a => ({ ...a, branch_id: e.target.value }))} sx={{ minWidth: 240 }}>
            <MenuItem value="">Select Branch</MenuItem>
            {(branches||[]).map(b => <MenuItem key={b.branch_id} value={b.branch_id}>{b.name}</MenuItem>)}
          </Select>
          <Button variant="contained" onClick={assignBranch}>Assign</Button>
        </Stack>
      </Paper>
    </Box>
  );
}


