import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Grid, Paper, Stack, Typography, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getLiveMapData } from '../../../supabase/api';
import { subscribeToBuses, subscribeToIncidents } from '../../../supabase/realtime';
import CommandCenterMap from './CommandCenterMap';

export default function LiveMapBusesTab() {
  const [buses, setBuses] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [statusRank, setStatusRank] = useState('all');
  const [showIncidents, setShowIncidents] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async (withLoader = false) => {
      if (withLoader) setLoading(true);
      try {
        const { buses: liveBuses, incidents: liveIncidents } = await getLiveMapData();
        if (!isActive) return;
        setBuses(liveBuses || []);
        setIncidents((liveIncidents || []).filter((item) => (
          item && typeof item.latitude === 'number' && typeof item.longitude === 'number'
        )));
      } finally {
        if (withLoader && isActive) setLoading(false);
      }
    };

    load(true);
    const busSub = subscribeToBuses(() => load());
    const incidentSub = subscribeToIncidents(() => load());

    return () => {
      isActive = false;
      busSub?.unsubscribe?.();
      incidentSub?.unsubscribe?.();
    };
  }, []);

  const tableRows = useMemo(() => {
    return (buses || []).map((bus) => {
      const latitude = typeof bus.latitude === 'number' ? bus.latitude : bus.latitude ? Number(bus.latitude) : null;
      const longitude = typeof bus.longitude === 'number' ? bus.longitude : bus.longitude ? Number(bus.longitude) : null;
      const statusLabel = bus.status_text
        || (bus.status_rank === 1 ? 'FIT'
          : bus.status_rank === 2 ? 'OK'
          : bus.status_rank === 3 ? 'UNWELL'
          : bus.status || 'Unknown');
      const locationDisplay = bus.location_label
        || (latitude != null && longitude != null ? `${latitude.toFixed(3)}, ${longitude.toFixed(3)}` : '-');
      return {
        bus_id: bus.bus_id,
        license_plate: bus.license_plate || '-',
        route_name: bus.route_name || '-',
        driver_name: bus.driver_name || '-',
        status_rank: bus.status_rank,
        status_label: statusLabel,
        location_display: locationDisplay,
        last_update: bus.last_update || null,
      };
    });
  }, [buses]);

  const filteredRows = useMemo(() => {
    if (statusRank === 'all') return tableRows;
    const rank = Number(statusRank);
    return tableRows.filter((row) => row.status_rank === rank);
  }, [statusRank, tableRows]);

  const renderRankChip = (rank, label) => {
    if (rank === 1) return <Chip size="small" color="success" label={label || 'FIT (1)'} />;
    if (rank === 2) return <Chip size="small" color="warning" label={label || 'OK (2)'} />;
    if (rank === 3) return <Chip size="small" color="error" label={label || 'UNWELL (3)'} />;
    return <Chip size="small" label={label || 'N/A'} />;
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <DashboardCard
          title="Live Map"
          variant="elevated"
          headerAction={(
            <FormControlLabel
              control={<Switch size="small" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} />}
              label="Show Incidents"
            />
          )}
        >
          <CommandCenterMap buses={buses} incidents={incidents} showIncidents={showIncidents} />
        </DashboardCard>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <DashboardCard title="Fleet Live Status" variant="outlined" headerAction={
            <Select size="small" value={statusRank} onChange={e => setStatusRank(e.target.value)}>
              <MenuItem value="all">All Status Ranks</MenuItem>
              <MenuItem value="1">FIT (1)</MenuItem>
              <MenuItem value="2">OK (2)</MenuItem>
              <MenuItem value="3">UNWELL (3)</MenuItem>
            </Select>
          }>
            <DataTable
              data={filteredRows}
              columns={[
                { field: 'license_plate', headerName: 'Bus' },
                { field: 'route_name', headerName: 'Route' },
                { field: 'driver_name', headerName: 'Driver' },
                { field: 'status_label', headerName: 'Status', renderCell: (row) => renderRankChip(row.status_rank, row.status_label) },
                { field: 'location_display', headerName: 'Location' },
                { field: 'last_update', headerName: 'Last Update', renderCell: (row) => row.last_update ? new Date(row.last_update).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-' },
              ]}
              searchable
              searchPlaceholder="Search buses, routes, drivers..."
              pagination
              loading={loading}
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


