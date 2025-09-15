import React, { useEffect, useState } from 'react';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { clockIn, clockOut, submitMaintenanceChecklist, reportDriverIncident } from '../../../supabase/api';

export default function LogsTab() {
  const [clockedIn, setClockedIn] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [incidentOpen, setIncidentOpen] = useState(false);
  const [checklist, setChecklist] = useState({ brakes: false, lights: false, fuel: false, tires: false });
  const [incident, setIncident] = useState({ description: '', severity: 'low' });

  const doClockIn = async () => { await clockIn(); setClockedIn(true); };
  const doClockOut = async () => { await clockOut(); setClockedIn(false); };

  const submitChecklist = async () => { await submitMaintenanceChecklist(checklist); setCheckOpen(false); };
  const submitIncident = async () => { await reportDriverIncident(incident.description, incident.severity); setIncidentOpen(false); setIncident({ description: '', severity: 'low' }); };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Shift Logs</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" onClick={doClockIn} disabled={clockedIn}>Clock In</Button>
        <Button variant="outlined" onClick={doClockOut} disabled={!clockedIn}>Clock Out</Button>
      </Stack>
      <Typography variant="h6" gutterBottom>Maintenance</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <Button onClick={()=>setCheckOpen(true)}>Pre-Trip Checklist</Button>
        <Button color="error" onClick={()=>setIncidentOpen(true)}>Report Incident</Button>
      </Stack>

      <Dialog open={checkOpen} onClose={()=>setCheckOpen(false)}>
        <DialogTitle>Pre/Post Trip Checklist</DialogTitle>
        <DialogContent>
          {['brakes','lights','fuel','tires'].map(k => (
            <FormControlLabel key={k} control={<Checkbox checked={!!checklist[k]} onChange={e => setChecklist(c => ({ ...c, [k]: e.target.checked }))} />} label={k.charAt(0).toUpperCase()+k.slice(1)} />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setCheckOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitChecklist}>Submit</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={incidentOpen} onClose={()=>setIncidentOpen(false)}>
        <DialogTitle>Incident Report</DialogTitle>
        <DialogContent>
          <TextField label="Description" multiline rows={4} fullWidth value={incident.description} onChange={e => setIncident(i => ({ ...i, description: e.target.value }))} sx={{ mt: 1 }} />
          <TextField label="Severity (low/medium/high)" fullWidth value={incident.severity} onChange={e => setIncident(i => ({ ...i, severity: e.target.value }))} sx={{ mt: 2 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setIncidentOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={submitIncident}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


