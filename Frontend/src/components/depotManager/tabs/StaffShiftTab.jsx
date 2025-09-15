import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function StaffShiftTab() {
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [tasks, setTasks] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: u }, { data: s }, { data: t }] = await Promise.all([
      supabase.from('users').select('user_id, name, role').eq('company_id', companyId).in('role', ['mechanic','dispatcher','boarding_operator','ops_manager','driver']),
      supabase.from('staff_shifts').select('id, staff_id, start_time, end_time, status').eq('company_id', companyId),
      supabase.from('staff_tasks').select('id, staff_name, role, status').eq('company_id', companyId),
    ]);
    setStaff(u||[]); setShifts(s||[]); setTasks(t||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Staff" variant="outlined">
          <DataTable data={staff} columns={[{ field: 'name', headerName: 'Name' }, { field: 'role', headerName: 'Role' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Shifts" variant="outlined">
          <DataTable data={shifts} columns={[{ field: 'staff_id', headerName: 'Staff' }, { field: 'start_time', headerName: 'Start', type: 'date' }, { field: 'end_time', headerName: 'End', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Tasks" variant="outlined">
          <DataTable data={tasks} columns={[{ field: 'staff_name', headerName: 'Staff' }, { field: 'role', headerName: 'Role' }, { field: 'status', headerName: 'Status' }]} searchable pagination />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
