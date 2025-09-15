import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, TextField, Typography } from '@mui/material';
import { getIncidentsForBus } from '../../../supabase/api';
import { reportDriverIncident } from '../../../supabase/api';

export default function MaintenanceTab() {
  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState('');
  useEffect(() => {
    const bus_id = window.currentBusId || null;
    if (bus_id) getIncidentsForBus(bus_id).then(res => setAlerts((res.data||[]).map(i => ({ id: i.incident_id, type: i.description, dueInKm: null, severity: i.severity }))));
  }, []);
  const submit = async () => { if (!issue.trim()) return; await reportDriverIncident(issue, 'medium'); setOpen(false); setIssue(''); };
  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Maintenance Alerts</Typography>
        {(alerts||[]).map(a => (
          <Paper key={a.id} sx={{ p: 1, mt: 1 }}>
            <Typography>{a.type} • Due in {a.dueInKm} km • {a.severity}</Typography>
          </Paper>
        ))}
      </Paper>
      <Button variant="contained" onClick={() => setOpen(true)}>Flag Issue</Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Flag a Maintenance Issue</DialogTitle>
        <DialogContent>
          <TextField label="Describe the issue" fullWidth multiline rows={3} value={issue} onChange={e => setIssue(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


