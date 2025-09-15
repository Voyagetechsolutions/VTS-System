import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function HROverviewTab() {
  const [kpis, setKpis] = useState({ total: 0, active: 0, inactive: 0, drivers: 0, depot: 0, booking: 0, maintenance: 0, admin: 0, openings: 0, checkedInToday: 0, missedCheckouts: 0 });
  const [openJobs, setOpenJobs] = useState([]);
  const [deptSummary, setDeptSummary] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const start = new Date(); start.setHours(0,0,0,0); const end = new Date(); end.setHours(23,59,59,999);
    const [{ data: users }, { data: jobs }, { data: atd }] = await Promise.all([
      supabase.from('users').select('user_id, role, is_active, department').eq('company_id', companyId),
      supabase.from('job_postings').select('*').eq('company_id', companyId).eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('attendance').select('id, staff_id, check_in, check_out').eq('company_id', companyId).gte('check_in', start.toISOString()).lte('check_in', end.toISOString()),
    ]);
    const total = (users||[]).length;
    const active = (users||[]).filter(u=>u.is_active!==false).length;
    const inactive = total - active;
    const roleCount = (r) => (users||[]).filter(u=>String(u.role||'')===r).length;
    const checkedInToday = (atd||[]).length;
    const missedCheckouts = (atd||[]).filter(a => !a.check_out).length;
    const byDept = new Map();
    (users||[]).forEach(u => {
      const dept = u.department || u.role || 'unknown';
      if (!byDept.has(dept)) byDept.set(dept, { dept, checkedIn: 0, users: 0 });
      byDept.get(dept).users += 1;
    });
    (atd||[]).forEach(a => {
      const u = (users||[]).find(x => x.user_id === a.staff_id);
      const dept = u?.department || u?.role || 'unknown';
      if (!byDept.has(dept)) byDept.set(dept, { dept, checkedIn: 0, users: 0 });
      byDept.get(dept).checkedIn += 1;
    });
    setDeptSummary(Array.from(byDept.values()).sort((a,b)=>a.dept.localeCompare(b.dept)));
    setKpis({ total, active, inactive, drivers: roleCount('driver'), depot: roleCount('depot_staff') + roleCount('depot_manager'), booking: roleCount('booking_officer'), maintenance: roleCount('maintenance_manager'), admin: roleCount('admin'), openings: (jobs||[]).length, checkedInToday, missedCheckouts });
    setOpenJobs(jobs||[]);
  })(); }, [companyId]);

  const addEmployee = async () => {
    const name = window.prompt('Full name');
    const email = window.prompt('Email');
    const role = window.prompt('Role');
    if (!name || !email || !role) return;
    await supabase.from('users').insert([{ company_id: companyId, name, email: email.toLowerCase(), role, is_active: true }]);
  };
  const approveLeave = async () => {
    const id = window.prompt('Leave request id');
    if (!id) return;
    await supabase.from('leaves').update({ status: 'approved' }).eq('id', id);
  };
  const postJob = async () => {
    const title = window.prompt('Job title');
    const description = window.prompt('Description');
    if (!title) return;
    await supabase.from('job_postings').insert([{ company_id: companyId, title, description, status: 'open' }]);
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={2}><StatsCard title="Total Employees" value={kpis.total} /></Grid>
      <Grid item xs={12} md={2}><StatsCard title="Active" value={kpis.active} /></Grid>
      <Grid item xs={12} md={2}><StatsCard title="Inactive" value={kpis.inactive} /></Grid>
      <Grid item xs={12} md={2}><StatsCard title="Drivers" value={kpis.drivers} /></Grid>
      <Grid item xs={12} md={2}><StatsCard title="Booking" value={kpis.booking} /></Grid>
      <Grid item xs={12} md={2}><StatsCard title="Maintenance" value={kpis.maintenance} /></Grid>

      <Grid item xs={12} md={8}>
        <DashboardCard title="Open Positions" variant="outlined">
          <DataTable data={openJobs} columns={[{ field: 'title', headerName: 'Title' }, { field: 'status', headerName: 'Status' }, { field: 'created_at', headerName: 'Posted', type: 'date' }]} searchable pagination />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Quick Actions" variant="elevated">
          <ModernButton icon="add" onClick={addEmployee}>Add Employee</ModernButton>
          <ModernButton icon="check" onClick={approveLeave}>Approve Leave</ModernButton>
          <ModernButton icon="add" onClick={postJob}>Post Job</ModernButton>
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Today: Department Summary" variant="outlined">
          <Grid container spacing={1}>
            {(deptSummary||[]).map(d => (
              <Grid key={d.dept} item xs={6} sm={4} md={2}>
                <StatsCard title={d.dept} value={`${d.checkedIn}/${d.users}`} />
              </Grid>
            ))}
            {(!deptSummary || deptSummary.length === 0) && <Box sx={{ p: 1, color: 'text.secondary' }}>No departments found</Box>}
          </Grid>
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Daily Check-ins by Department" variant="outlined">
          <DataTable data={deptSummary} columns={[{ field: 'dept', headerName: 'Department/Role' }, { field: 'users', headerName: 'Users' }, { field: 'checkedIn', headerName: 'Checked-in Today' }]} searchable pagination />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}


