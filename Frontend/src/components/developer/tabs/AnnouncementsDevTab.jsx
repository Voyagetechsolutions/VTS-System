import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listAnnouncementsGlobal, createAnnouncement } from '../../../supabase/api';
import { ModernTextField, ModernButton } from '../../common/FormComponents';

export default function AnnouncementsDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = async () => {
    setLoading(true);
    const res = await listAnnouncementsGlobal();
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title || !form.content) return;
    await createAnnouncement({ title: form.title, content: form.content });
    setForm({ title: '', content: '' });
    load();
  };

  return (
    <>
      <DashboardCard title="Send Global Announcement" variant="outlined">
        <Box sx={{ display: 'grid', gap: 2 }}>
          <ModernTextField label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <ModernTextField label="Content" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} multiline rows={3} />
          <ModernButton variant="contained" icon="announcements" onClick={submit}>Send</ModernButton>
        </Box>
      </DashboardCard>

      <DashboardCard title="Recent Announcements" variant="outlined" sx={{ mt: 2 }}>
        <DataTable
          data={rows}
          loading={loading}
          columns={[
            { field: 'created_at', headerName: 'Time', type: 'date' },
            { field: 'title', headerName: 'Title' },
            { field: 'content', headerName: 'Content' },
          ]}
          searchable
          pagination
        />
      </DashboardCard>
    </>
  );
}
