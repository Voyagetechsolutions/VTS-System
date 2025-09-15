import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getFinanceAggregates, getPaymentsGlobal, getAllBookingsGlobal } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernButton } from '../../common/FormComponents';

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

  return (
    <>
      <DashboardCard title="Revenue by Day" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.byDay, 'revenue_by_day.csv')}>Export</ModernButton>}>
        <DataTable data={agg.byDay} columns={[{ field: 'date', headerName: 'Date', type: 'date' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Revenue by Route" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.byRoute, 'revenue_by_route.csv')}>Export</ModernButton>}>
        <DataTable data={agg.byRoute} columns={[{ field: 'route_id', headerName: 'Route' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
      </DashboardCard>
      <Box sx={{ height: 12 }} />
      <DashboardCard title="Expenses by Type" variant="outlined" action={<ModernButton variant="outlined" icon="download" onClick={() => exportCSV(agg.expenses, 'expenses_by_type.csv')}>Export</ModernButton>}>
        <DataTable data={agg.expenses} columns={[{ field: 'type', headerName: 'Type' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination searchable />
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
