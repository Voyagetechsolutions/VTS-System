import React, { useMemo, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Stack, Alert, MenuItem } from '@mui/material';

export default function InvitationsAdmin() {
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('booking_officer');
  const [companyId, setCompanyId] = useState('');
  const [hours, setHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const roles = useMemo(() => [
    'admin','developer','ops_manager','booking_officer','boarding_operator','driver','depot_manager','maintenance_manager','finance_manager','hr_manager'
  ], []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        role,
        companyId: companyId ? Number(companyId) : null,
        expiresHours: Number(hours) || 24
      };
      const resp = await fetch(`${API_BASE_URL}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error(`Invite failed: ${resp.status}`);
      const data = await resp.json();
      setMessage(`Invitation sent to ${data.email} (expires ${new Date(data.expiresAt).toLocaleString()})`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 2 }}>
      <Paper sx={{ width: '100%', maxWidth: 560, p: 4, boxShadow: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>Admin: Send Invitation</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}
          <form onSubmit={handleCreate}>
            <Stack spacing={1.5}>
              <TextField label="User email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@company.com" fullWidth />
              <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
                {roles.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
              <TextField label="Company ID" type="number" value={companyId} onChange={(e) => setCompanyId(e.target.value)} placeholder="e.g. 1" fullWidth />
              <TextField label="Expires in (hours)" type="number" value={hours} onChange={(e) => setHours(e.target.value)} fullWidth />
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Sending…' : 'Send Invite'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
