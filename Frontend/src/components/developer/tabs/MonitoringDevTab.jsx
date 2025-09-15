import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getActivityLogGlobal } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function MonitoringDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeSearch, setTypeSearch] = useState('');
  const [messageSearch, setMessageSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await getActivityLogGlobal();
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const inRange = (d) => {
    const ts = d ? new Date(d).getTime() : null;
    const fromTs = fromDate ? new Date(fromDate).getTime() : null;
    const toTs = toDate ? new Date(toDate).getTime() : null;
    if (ts == null) return true;
    if (fromTs != null && ts < fromTs) return false;
    if (toTs != null && ts > toTs) return false;
    return true;
  };

  const filtered = rows.filter(r => (
    inRange(r.created_at) &&
    ((typeSearch || '').trim() === '' ? true : (r.type || '').toLowerCase().includes(typeSearch.toLowerCase())) &&
    ((messageSearch || '').trim() === '' ? true : (r.message || '').toLowerCase().includes(messageSearch.toLowerCase()))
  ));

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'monitoring_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardCard title="System Monitoring & Logs" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernTextField label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <ModernTextField label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <ModernTextField label="Type" value={typeSearch} onChange={e => setTypeSearch(e.target.value)} />
        <ModernTextField label="Message" value={messageSearch} onChange={e => setMessageSearch(e.target.value)} />
        <ModernButton variant="outlined" icon="download" onClick={exportCSV}>Export CSV</ModernButton>
      </Box>
    }>
      <DataTable
        data={filtered}
        loading={loading}
        columns={[
          { field: 'created_at', headerName: 'Time', type: 'date' },
          { field: 'type', headerName: 'Type' },
          { field: 'message', headerName: 'Message' },
          { field: 'company_id', headerName: 'Company' },
        ]}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
