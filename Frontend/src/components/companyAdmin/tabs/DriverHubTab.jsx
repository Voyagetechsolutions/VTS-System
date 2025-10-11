import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import PieChart from '../../charts/PieChart';
import BarChart from '../../charts/BarChart';
import DataTable from '../../common/DataTable';
import { getDrivers, listTripSchedules, listDriverTraining, upsertDriverTraining, listDriverKPIs, listDriverShifts, upsertDriverShift } from '../../../database';
import { ModernTextField, ModernSelect, ModernButton } from '../../common/FormComponents';

export default function DriverHubTab() {
  const [drivers, setDrivers] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [training, setTraining] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [newTraining, setNewTraining] = useState({ id: null, driver_id: '', course: '', status: 'Assigned' });
  const [newShift, setNewShift] = useState({ id: null, driver_id: '', route_id: '', start_time: '', end_time: '', status: 'Assigned' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [d, s, t, k, sh] = await Promise.all([
      getDrivers(),
      listTripSchedules(),
      listDriverTraining(),
      listDriverKPIs(),
      listDriverShifts(),
    ]);
    setDrivers(d.data || []);
    setShifts((sh.data || []).slice(0, 100));
    setTraining(t.data || []);
    setPerformance(k.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Drivers Active" value={drivers.length} icon="users" color="primary" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Shifts Today" value={shifts.filter(s => (s.start_time||'').slice(0,10) === new Date().toISOString().slice(0,10)).length} icon="schedule" color="info" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Training Complete" value={`${Math.round((training.filter(t => (t.status||'').toLowerCase()==='completed').length / Math.max(training.length,1)) * 100)}%`} icon="check" color="success" /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatsCard title="Avg On-time %" value={`${(performance.length ? Math.round(performance.reduce((a,b)=>a+Number(b.on_time_percent||0),0)/performance.length) : 0)}%`} icon="trend" color="secondary" /></Grid>
        </Grid>
      </Grid>
      {/* Analytics Row */}
      <Grid item xs={12} md={6}>
        <DashboardCard title="Training Completion" variant="outlined">
          <PieChart
            data={(function(){
              const total = training.length || 0;
              const completed = training.filter(t => (t.status||'').toLowerCase()==='completed').length;
              const remaining = Math.max(total - completed, 0);
              return [
                { label: 'Completed', value: completed },
                { label: 'Remaining', value: remaining },
              ];
            })()}
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Top Drivers by Trips Completed" variant="outlined">
          <BarChart
            data={(performance||[])
              .map(k => ({ label: String(k.driver_id).slice(0,6), value: Number(k.trips_completed||0) }))
              .sort((a,b)=>b.value-a.value)
              .slice(0,10)}
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Drivers" variant="outlined">
          <DataTable
            data={drivers}
            loading={loading}
            columns={[
              { field: 'name', headerName: 'Name' },
              { field: 'license_number', headerName: 'License' },
              { field: 'status', headerName: 'Status' },
              { field: 'assigned_route_id', headerName: 'Assigned Route' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Shifts" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernSelect label="Driver" value={newShift.driver_id} onChange={e => setNewShift(s => ({ ...s, driver_id: e.target.value }))} options={[{ value: '', label: 'Driver' }, ...(drivers||[]).map(dr => ({ value: dr.driver_id, label: dr.name }))]} />
            <ModernTextField label="Route ID" value={newShift.route_id} onChange={e => setNewShift(s => ({ ...s, route_id: e.target.value }))} />
            <ModernTextField label="Start" type="datetime-local" value={newShift.start_time} onChange={e => setNewShift(s => ({ ...s, start_time: e.target.value }))} />
            <ModernTextField label="End" type="datetime-local" value={newShift.end_time} onChange={e => setNewShift(s => ({ ...s, end_time: e.target.value }))} />
            <ModernButton variant="contained" icon="save" onClick={async () => { await upsertDriverShift(newShift); setNewShift({ id: null, driver_id: '', route_id: '', start_time: '', end_time: '', status: 'Assigned' }); load(); }}>Assign</ModernButton>
          </Box>
        }>
          <DataTable
            data={shifts}
            loading={loading}
            columns={[
              { field: 'driver_id', headerName: 'Driver' },
              { field: 'route_id', headerName: 'Route' },
              { field: 'start_time', headerName: 'Start' },
              { field: 'end_time', headerName: 'End' },
              { field: 'status', headerName: 'Status' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Compliance Training" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernSelect label="Driver" value={newTraining.driver_id} onChange={e => setNewTraining(t => ({ ...t, driver_id: e.target.value }))} options={[{ value: '', label: 'Driver' }, ...(drivers||[]).map(dr => ({ value: dr.driver_id, label: dr.name }))]} />
            <ModernTextField label="Course" value={newTraining.course} onChange={e => setNewTraining(t => ({ ...t, course: e.target.value }))} />
            <ModernSelect label="Status" value={newTraining.status} onChange={e => setNewTraining(t => ({ ...t, status: e.target.value }))} options={[{ value: 'Assigned', label: 'Assigned' }, { value: 'In Progress', label: 'In Progress' }, { value: 'Completed', label: 'Completed' }]} />
            <ModernButton variant="contained" icon="save" onClick={async () => { await upsertDriverTraining(newTraining); setNewTraining({ id: null, driver_id: '', course: '', status: 'Assigned' }); load(); }}>Save</ModernButton>
          </Box>
        }>
          <DataTable
            data={training}
            loading={loading}
            columns={[
              { field: 'driver_id', headerName: 'Driver' },
              { field: 'course', headerName: 'Course' },
              { field: 'status', headerName: 'Status' },
              { field: 'assigned_at', headerName: 'Assigned' },
              { field: 'completed_at', headerName: 'Completed' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Performance" variant="outlined" headerAction={<ModernButton variant="outlined" icon="download" onClick={() => {
          const rows = performance;
          if (!rows?.length) return;
          const headers = Object.keys(rows[0]);
          const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
          const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'driver_kpis.csv';
          a.click();
          URL.revokeObjectURL(url);
        }}>Export KPIs</ModernButton>}>
          <DataTable
            data={performance}
            loading={loading}
            columns={[
              { field: 'driver_id', headerName: 'Driver' },
              { field: 'trips_completed', headerName: 'Trips Completed' },
              { field: 'average_rating', headerName: 'Avg Rating' },
              { field: 'on_time_percent', headerName: 'On-time %' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
