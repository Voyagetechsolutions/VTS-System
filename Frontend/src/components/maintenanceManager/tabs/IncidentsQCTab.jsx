import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getIncidents, createIncident } from '../../../supabase/api';
import { Box, TextField, Button } from '@mui/material';

export default function IncidentsQCTab() {
  const [rows, setRows] = useState([]);
  const [type, setType] = useState('');
  const [details, setDetails] = useState('');
  const load = async () => { const r = await getIncidents(); setRows(r.data || []); };
  useEffect(() => { load(); }, []);
  const submit = async () => { if (!type.trim()) return; await createIncident({ type, details }); setType(''); setDetails(''); load(); };
  return (
    <Box>
      <DashboardCard title="Report Incident" variant="outlined" action={<Button variant="contained" onClick={submit}>Submit</Button>}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" label="Type" value={type} onChange={e => setType(e.target.value)} />
          <TextField size="small" label="Details" value={details} onChange={e => setDetails(e.target.value)} fullWidth />
        </Box>
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Incidents" variant="outlined">
          <DataTable data={rows} columns={[{ field: 'created_at', headerName: 'Time', type: 'date' }, { field: 'type', headerName: 'Type' }, { field: 'details', headerName: 'Details' }]} searchable pagination />
        </DashboardCard>
      </Box>
    </Box>
  );
}
