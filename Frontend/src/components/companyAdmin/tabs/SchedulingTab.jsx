import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listTripSchedules, upsertTripSchedule, getAllRoutesGlobal } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernButton, ModernSelect, ModernTextField } from '../../common/FormComponents';

export default function SchedulingTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, route_id: '', departure_time: '', arrival_time: '', frequency: 'Daily' });
  const [routes, setRoutes] = useState([]);

  const load = async () => {
    setLoading(true);
    const [r, rt] = await Promise.all([listTripSchedules(), getAllRoutesGlobal()]);
    setRows(r.data || []);
    setRoutes(rt.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await upsertTripSchedule(form);
    setForm({ id: null, route_id: '', departure_time: '', arrival_time: '', frequency: 'Daily' });
    load();
  };

  return (
    <DashboardCard title="Trip Scheduling" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernSelect label="Route" value={form.route_id} onChange={e => setForm(f => ({ ...f, route_id: e.target.value }))} options={[{ value: '', label: 'Select' }, ...(routes||[]).map(r => ({ value: r.route_id, label: `${r.origin} → ${r.destination}` }))]} />
        <ModernTextField label="Depart" type="time" value={form.departure_time} onChange={e => setForm(f => ({ ...f, departure_time: e.target.value }))} />
        <ModernTextField label="Arrive" type="time" value={form.arrival_time} onChange={e => setForm(f => ({ ...f, arrival_time: e.target.value }))} />
        <ModernTextField label="Frequency" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} />
        <ModernButton variant="contained" icon="save" onClick={save}>Save</ModernButton>
      </Box>
    }>
      <DataTable
        data={rows}
        loading={loading}
        columns={[
          { field: 'route_id', headerName: 'Route' },
          { field: 'departure_time', headerName: 'Depart' },
          { field: 'arrival_time', headerName: 'Arrive' },
          { field: 'frequency', headerName: 'Frequency' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
