import React, { useEffect, useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import { supabase } from '../../../supabase/client';
import { upsertMaintenanceLog, recordDriverInspection } from '../../../supabase/api';

export default function VehicleInfoTab() {
  const [bus, setBus] = useState(null);
  const userId = window.userId || localStorage.getItem('userId');

  const load = async () => {
    try {
      const { data, error } = await supabase.rpc('get_assigned_bus_for_driver', { p_driver_id: userId });
      if (!error) setBus(data || null);
    } catch { setBus(null); }
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [userId]);

  const reportIssue = async () => {
    const details = prompt('Vehicle issue details');
    if (!details || !bus?.bus_id) return;
    await upsertMaintenanceLog({ bus_id: bus.bus_id, notes: details, status: 'reported' });
    alert('Issue reported');
  };
  const depotInspection = async () => {
    if (!bus) { alert('No assigned vehicle'); return; }
    const tripId = null; // depot inspection without trip
    await recordDriverInspection({ trip_id: tripId, items: { brakes: true, lights: true, tires: true }, passed: true });
    alert('Depot inspection submitted');
  };

  return (
    <Box>
      <DashboardCard title="Assigned Vehicle" variant="outlined">
        {!bus && <Typography variant="body2">No assigned vehicle</Typography>}
        {bus && (
          <Box>
            <div>License Plate: {bus.license_plate}</div>
            <div>Capacity: {bus.capacity}</div>
            <div>Status: {bus.status}</div>
            <div>Fuel: {bus.fuel_level || '-'}%</div>
          </Box>
        )}
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Maintenance Alerts" variant="outlined">
          <div>Check dashboard for alerts and scheduled maintenance.</div>
          <Button variant="contained" sx={{ mt: 1 }} onClick={reportIssue}>Report Vehicle Issue</Button>
          <Button variant="outlined" sx={{ mt: 1, ml: 1 }} onClick={depotInspection}>Inspect at Depot</Button>
        </DashboardCard>
      </Box>
    </Box>
  );
}
