import React, { useEffect, useMemo, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { listFuelLogs, upsertFuelLog, getAllBusesGlobal } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';
import { Box } from '@mui/material';
import { ModernButton, ModernSelect, ModernTextField } from '../../common/FormComponents';

// Chart components defined outside to avoid re-creation on each render
const BarChart = ({ data, width = 480, height = 180, color = '#1976d2' }) => {
  const max = Math.max(1, ...data.map(([, v]) => v));
  const barWidth = Math.max(8, Math.floor((width - 40) / Math.max(1, data.length)));
  return (
    <svg width={width} height={height} style={{ background: 'transparent' }}>
      {data.map(([label, value], i) => {
        const h = Math.round((value / max) * (height - 40));
        const x = 30 + i * barWidth;
        const y = height - 20 - h;
        return (
          <g key={label}>
            <rect x={x} y={y} width={barWidth - 4} height={h} fill={color} rx={3} />
            <text x={x + (barWidth - 4) / 2} y={height - 6} fontSize="9" textAnchor="middle" fill="#666">{String(label).slice(0,6)}</text>
          </g>
        );
      })}
      <text x={4} y={12} fontSize="11" fill="#444">Top Fuel Cost by Bus</text>
    </svg>
  );
};

const LineChart = ({ data, width = 480, height = 180, color = '#2e7d32' }) => {
  if (!data.length) return <svg width={width} height={height} />;
  const values = data.map(([, v]) => v);
  const max = Math.max(1, ...values);
  const stepX = (width - 40) / Math.max(1, data.length - 1);
  const points = data.map(([, v], i) => {
    const x = 20 + i * stepX;
    const y = height - 20 - Math.round((v / max) * (height - 40));
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ background: 'transparent' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
      {data.map(([label, v], i) => {
        const x = 20 + i * stepX;
        const y = height - 20 - Math.round((v / max) * (height - 40));
        return <circle key={label} cx={x} cy={y} r={2} fill={color} />;
      })}
      <text x={4} y={12} fontSize="11" fill="#444">Fuel Consumption (last 14 days)</text>
    </svg>
  );
};

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
  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, []);

  const save = async () => {
    await upsertFuelLog(form);
    setForm({ id: null, bus_id: '', date: '', liters: '', cost: '', station: '' });
    load();
  };

  // Aggregations for charts
  const costByBus = useMemo(() => {
    const map = new Map();
    (rows||[]).forEach(r => {
      const key = r.bus_id || 'Unknown';
      map.set(key, (map.get(key) || 0) + Number(r.cost || 0));
    });
    // Sort descending
    return Array.from(map.entries()).sort((a,b) => b[1]-a[1]).slice(0, 10);
  }, [rows]);

  const consumptionTrend = useMemo(() => {
    const byDate = new Map();
    (rows||[]).forEach(r => {
      const d = r.date ? String(r.date) : '';
      if (!d) return;
      byDate.set(d, (byDate.get(d) || 0) + Number(r.liters || 0));
    });
    const arr = Array.from(byDate.entries()).sort((a,b) => new Date(a[0]) - new Date(b[0]));
    return arr.slice(-14); // last 14 days
  }, [rows]);

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
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <BarChart data={costByBus} />
        <LineChart data={consumptionTrend} />
      </Box>
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
