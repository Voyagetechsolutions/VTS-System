import React from 'react';
import { Box, Button } from '@mui/material';
import CheckInTab from './CheckInTab';
import { getPassengerManifest } from '../../../supabase/api';

export default function CheckInBoardingTab() {
  const exportManifest = async () => {
    const tripId = prompt('Trip ID to export manifest');
    if (!tripId) return;
    const r = await getPassengerManifest(tripId);
    const rows = r.data || [];
    if (!rows.length) return alert('No data');
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(',')].concat(rows.map(x => headers.map(h => JSON.stringify(x[h] ?? '')).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `manifest_${tripId}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button variant="outlined" onClick={exportManifest}>Export Manifest CSV</Button>
      </Box>
      <CheckInTab />
    </Box>
  );
}
