import React, { useEffect, useMemo, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getFinanceAggregates, getPaymentsGlobal, getAllBookingsGlobal } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernButton } from '../../common/FormComponents';
import BarChart from '../charts/BarChart';
import PieChart from '../../charts/PieChart';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function FinanceCenterTab() {
  const [agg, setAgg] = useState({ byDay: [], byRoute: [], expenses: [] });
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);

  const daySeries = useMemo(() => (agg.byDay || []).map(r => [r.date?.slice?.(0,10) || r.date, Number(r.amount||0)]), [agg.byDay]);
  const routeSeries = useMemo(() => (agg.byRoute || []).map(r => ({ label: String(r.route_id||'Unknown'), value: Number(r.amount||0) })), [agg.byRoute]);

  const LineChart = ({ data, width = 520, height = 200, color = '#1976d2' }) => {
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
      <svg width={width} height={height}>
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      </svg>
    );
  };

  const load = async () => {
    const [a, p, b] = await Promise.all([getFinanceAggregates(), getPaymentsGlobal(), getAllBookingsGlobal()]);
    setAgg(a.data || { byDay: [], byRoute: [], expenses: [] });
    setPayments(p.data || []);
    setBookings(b.data || []);
  };
  useEffect(() => { load(); }, []);

  const exportCSV = (rows, filename) => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = (rows, filename) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const table = `\uFEFF<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>` +
      rows.map(r=>`<tr>${headers.map(h=>`<td>${String(r[h] ?? '')}</td>`).join('')}</tr>`).join('') +
      '</tbody></table>';
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <DashboardCard title="Revenue by Day" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.byDay, 'revenue_by_day.csv')}>Export</ModernButton>}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <LineChart data={daySeries} />
          <Box sx={{ flex: 1, minWidth: 360 }}>
            <DataTable data={agg.byDay} columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
          </Box>
        </Box>
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Revenue by Route" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.byRoute, 'revenue_by_route.csv')}>Export</ModernButton>}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <BarChart data={routeSeries} />
          <Box sx={{ flex: 1, minWidth: 360 }}>
            <DataTable data={agg.byRoute} columns={[{ field: 'route_id', headerName: 'Route' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
          </Box>
        </Box>
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Expenses by Type" variant="outlined" action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.expenses, 'expenses_by_type.csv')}>CSV</ModernButton>
          <ModernButton variant="outlined" icon="download" onClick={() => exportExcel(agg.expenses, 'expenses_by_type.xls')}>Excel</ModernButton>
        </Box>
      }>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 320, flex: 1 }}>
            <PieChart data={(agg.expenses||[]).map(r => ({ label: r.type, value: Number(r.amount||0) }))} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 360 }}>
            <DataTable data={agg.expenses} columns={[{ field: 'type', headerName: 'Type' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
          </Box>
        </Box>
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Payments" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(payments, 'payments.csv')}>Export</ModernButton>}>
        <DataTable data={payments} columns={[{ field: 'payment_id', headerName: 'ID' }, { field: 'created_at', headerName: 'Date', type: 'date' }, { field: 'status', headerName: 'Status' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Bookings" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(bookings, 'bookings.csv')}>Export</ModernButton>}>
        <DataTable data={bookings} columns={[{ field: 'booking_id', headerName: 'ID' }, { field: 'booking_date', headerName: 'Date', type: 'date' }, { field: 'status', headerName: 'Status' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
      </DashboardCard>
    </>
  );
}
