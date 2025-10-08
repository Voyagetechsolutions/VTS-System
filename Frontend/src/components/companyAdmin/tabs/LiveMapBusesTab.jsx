import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Paper, Stack, Typography, Select, MenuItem } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getFleetStatus } from '../../../supabase/api';
import CommandCenterMap from './CommandCenterMap';

export default function LiveMapBusesTab() {
  const [buses, setBuses] = useState([]);
  const [status, setStatus] = useState('all');

  useEffect(() => { getFleetStatus().then(({ data }) => setBuses(data || [])); }, []);

  const filtered = useMemo(() => {
    if (status === 'all') return buses;
    return (buses || []).filter(b => String(b.status || '').toLowerCase() === status);
  }, [buses, status]);

  const renderRankChip = (rank) => {
    if (rank === 1) return <Chip size="small" color="success" label="FIT (1)" />;
    if (rank === 2) return <Chip size="small" color="warning" label="OK (2)" />;
    if (rank === 3) return <Chip size="small" color="error" label="UNWELL (3)" />;
    return <Chip size="small" label="N/A" />;
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <DashboardCard title="Live Map" variant="elevated">
          <CommandCenterMap />
        </DashboardCard>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <DashboardCard title="Fleet Live Status" variant="outlined" headerAction={
            <Select size="small" value={status} onChange={e => setStatus(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="parked">Parked</MenuItem>
              <MenuItem value="off duty">Off Duty</MenuItem>
              <MenuItem value="on the road">On the Road</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
              <MenuItem value="service">Service</MenuItem>
            </Select>
          }>
            <DataTable
              data={filtered}
              columns={[
                { field: 'license_plate', headerName: 'Bus' },
                { field: 'status', headerName: 'Status' },
                { field: 'passengers', headerName: 'Passengers' },
                { field: 'rank', headerName: 'Rank', renderCell: (row) => renderRankChip(row.rank) },
                { field: 'current_route', headerName: 'Route' },
              ]}
              searchable
              pagination
            />
          </DashboardCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Rank Key</Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">{renderRankChip(1)}<Typography>Fit to Drive</Typography></Stack>
              <Stack direction="row" spacing={1} alignItems="center">{renderRankChip(2)}<Typography>OK</Typography></Stack>
              <Stack direction="row" spacing={1} alignItems="center">{renderRankChip(3)}<Typography>Unwell</Typography></Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}


