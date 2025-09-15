import React, { useEffect, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function KnowledgeBaseTab() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    const { data } = await supabase.from('maintenance_kb').select('id, title, tags, created_at').eq('company_id', companyId).order('created_at', { ascending: false });
    setRows(data || []);
  };
  useEffect(() => { load(); }, [companyId]);

  const add = async () => {
    const title = prompt('Title'); if (!title) return;
    const content = prompt('Content'); if (!content) return;
    await supabase.from('maintenance_kb').insert({ company_id: companyId, title, content });
    load();
  };

  const filtered = rows.filter(r => !q || String(r.title||'').toLowerCase().includes(q.toLowerCase()));

  return (
    <Box>
      <DashboardCard title="Knowledge Base" variant="outlined" action={<Button variant="contained" onClick={add}>Add</Button>} headerAction={<TextField size="small" label="Search" value={q} onChange={e=>setQ(e.target.value)} />}>
        <DataTable data={filtered} columns={[{ field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'title', headerName: 'Title' }, { field: 'tags', headerName: 'Tags' }]} searchable pagination />
      </DashboardCard>
    </Box>
  );
}


