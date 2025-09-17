import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listFuelLogs, upsertFuelLog, getAllBusesGlobal } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';
import { Box } from '@mui/material';
import { ModernButton, ModernSelect, ModernTextField } from '../../common/FormComponents';

export default function FuelTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ id: null, bus_id: '', date: '', liters: '', cost: '', station: '', receipt_url: '' });
  const [buses, setBuses] = useState([]);

  const load = async () => {
    setLoading(true);
    const [r, b] = await Promise.all([listFuelLogs(), getAllBusesGlobal()]);
    setRows(r.data || []);
    setBuses(b.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    await upsertFuelLog(form);
    setForm({ id: null, bus_id: '', date: '', liters: '', cost: '', station: '' });
    load();
  };

  return (
    <DashboardCard title="Fuel Tracking" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernSelect label="Bus" value={form.bus_id} onChange={e => setForm(f => ({ ...f, bus_id: e.target.value }))} options={[{ value: '', label: 'Select' }, ...(buses||[]).map(b => ({ value: b.bus_id, label: b.license_plate }))]} />
        <ModernTextField label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
        <ModernTextField label="Liters" type="number" value={form.liters} onChange={e => setForm(f => ({ ...f, liters: e.target.value }))} />
        <ModernTextField label="Cost" type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
        <ModernTextField label="Station" value={form.station} onChange={e => setForm(f => ({ ...f, station: e.target.value }))} />
        <input type="file" accept="image/*" onChange={async (e)=>{
          const file = e.target.files?.[0];
          if (!file || !form.bus_id) return;
          const path = `fuel/${form.bus_id}/${Date.now()}_${file.name}`;
          try {
            const { data, error } = await supabase.storage.from('evidence').upload(path, file, { upsert: true });
            if (!error) setForm(f => ({ ...f, receipt_url: data?.path || path }));
          } catch {}
        }} />
        <ModernButton variant="contained" icon="save" onClick={save}>Save</ModernButton>
      </Box>
    }>
      <DataTable
        data={rows}
        loading={loading}
        columns={[
          { field: 'date', headerName: 'Date', type: 'date' },
          { field: 'bus_id', headerName: 'Bus' },
          { field: 'liters', headerName: 'Liters' },
          { field: 'cost', headerName: 'Cost', type: 'currency' },
          { field: 'station', headerName: 'Station' },
          { field: 'receipt_url', headerName: 'Receipt', renderCell: (row) => row.receipt_url ? <a href={supabase.storage.from('evidence').getPublicUrl(row.receipt_url).data.publicUrl} target="_blank" rel="noreferrer">View</a> : '-' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
