import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listMaintenanceLogs, upsertMaintenanceLog, getAllBusesGlobal } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';
import { getCompanySettings } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernButton, ModernSelect, ModernTextField } from '../../common/FormComponents';

export default function MaintenanceTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, bus_id: '', date: '', type: '', cost: '', notes: '', file_url: '' });
  const [buses, setBuses] = useState([]);
  const [canEdit, setCanEdit] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([listMaintenanceLogs(), getAllBusesGlobal()]);
    setRows(r.data || []);
    setBuses(b.data || []);
    setLoading(false);
  };
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);
  useEffect(() => { (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })(); }, []);

  const save = async () => {
    await upsertMaintenanceLog(form);
    setForm({ id: null, bus_id: '', date: '', type: '', cost: '', notes: '', file_url: '' });
    load();
  };

  return (
    <DashboardCard title="Maintenance Logs" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernSelect label="Bus" value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))} options={[{ value: '', label: 'Select' }, ...(buses||[]).map(b => ({ value: b.bus_id, label: b.license_plate }))]} />
        <ModernTextField label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <ModernTextField label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
        <ModernTextField label="Cost" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
        <ModernTextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        {canEdit && (
        <input type="file" accept="application/pdf,image/*" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !form.bus_id) return;
          const path = `maintenance/${form.bus_id}/${Date.now()}_${file.name}`;
          try {
            const { data, error } = await supabase.storage.from('evidence').upload(path, file, { upsert: true });
            if (!error) setForm(f => ({ ...f, file_url: data?.path || path }));
          } catch {}
        }} />)}
        {canEdit && <ModernButton variant="contained" icon="save" onClick={save}>Save</ModernButton>}
      </Box>
    }>
      <DataTable
        data={rows}
        loading={loading}
        columns={[
          { field: 'date', headerName: 'Date', type: 'date' },
          { field: 'bus_id', headerName: 'Bus' },
          { field: 'type', headerName: 'Type' },
          { field: 'cost', headerName: 'Cost', type: 'currency' },
          { field: 'notes', headerName: 'Notes' },
          { field: 'file_url', headerName: 'Report', render: (v) => v ? <a href={supabase.storage.from('evidence').getPublicUrl(v).data.publicUrl} target="_blank" rel="noreferrer">View</a> : '-' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
