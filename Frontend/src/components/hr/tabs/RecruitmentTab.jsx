import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function RecruitmentTab() {
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => {
    const [{ data: j }, { data: a }] = await Promise.all([
      supabase.from('job_postings').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
      supabase.from('applications').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    ]);
    setJobs(j||[]); setApps(a||[]);
  };
  useEffect(() => { load(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}><DashboardCard title="Job Postings" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
        const title = window.prompt('Title');
        const description = window.prompt('Description');
        if (!title) return;
        await supabase.from('job_postings').insert([{ company_id: companyId, title, description, status: 'open' }]);
        load();
      }}>New Posting</ModernButton>}>
        <DataTable data={jobs} columns={[{ field: 'title', headerName: 'Title' }, { field: 'status', headerName: 'Status' }, { field: 'created_at', headerName: 'Posted', type: 'date' }]} searchable pagination rowActions={[{ label: 'Close', icon: 'check', onClick: async (row)=>{ await supabase.from('job_postings').update({ status: 'closed' }).eq('id', row.id); load(); } }]} />
      </DashboardCard></Grid>
      <Grid item xs={12} md={6}><DashboardCard title="Applications" variant="outlined" headerAction={<ModernButton icon="add" onClick={async ()=>{
        const jobId = window.prompt('Job ID');
        const name = window.prompt('Applicant name');
        const email = window.prompt('Email');
        const phone = window.prompt('Phone');
        if (!jobId || !name) return;
        await supabase.from('applications').insert([{ company_id: companyId, job_id: jobId, name, email: email?.toLowerCase() || null, phone: phone || null, status: 'applied' }]);
        load();
      }}>Add Application</ModernButton>}>
        <DataTable data={apps} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'job_id', headerName: 'Job' }, { field: 'name', headerName: 'Name' }, { field: 'email', headerName: 'Email' }, { field: 'phone', headerName: 'Phone' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Advance', icon: 'check', onClick: async (row)=>{ const next = row.status === 'applied' ? 'interview' : (row.status === 'interview' ? 'offer' : 'hired'); await supabase.from('applications').update({ status: next }).eq('id', row.id); load(); } }]} />
      </DashboardCard></Grid>
    </Grid>
  );
}


