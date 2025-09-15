import React, { useEffect, useState } from 'react';
import { Grid, Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllBookingsGlobal, getPaymentsGlobal, getCompaniesLight } from '../../../supabase/api';
import { ModernSelect, ModernButton, ModernTextField } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function BookingsDevTab() {
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [bookingIdSearch, setBookingIdSearch] = useState('');
  const [paymentIdSearch, setPaymentIdSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [b, p, cl] = await Promise.all([getAllBookingsGlobal(), getPaymentsGlobal(), getCompaniesLight()]);
    setBookings(b.data || []);
    setPayments(p.data || []);
    setCompanies(cl.data || []);
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
  const filteredBookings = bookings.filter(r => (
    (companyFilter ? r.company_id === companyFilter : true) && inRange(r.booking_date) &&
    ((bookingIdSearch || '').trim() === '' ? true : String(r.booking_id).includes(bookingIdSearch))
  ));
  const filteredPayments = payments.filter(r => (
    (companyFilter ? r.company_id === companyFilter : true) && inRange(r.created_at) &&
    ((paymentIdSearch || '').trim() === '' ? true : String(r.payment_id).includes(paymentIdSearch))
  ));

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
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <DashboardCard title="Bookings" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernSelect label="Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...companies.map(c => ({ value: c.company_id, label: c.name }))]} />
            <ModernTextField label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <ModernTextField label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            <ModernTextField label="Booking ID" value={bookingIdSearch} onChange={e => setBookingIdSearch(e.target.value)} />
            <ModernButton variant="outlined" icon="download" onClick={() => exportCSV(filteredBookings, 'bookings.csv')}>Export CSV</ModernButton>
          </Box>
        }>
          <DataTable
            data={filteredBookings}
            loading={loading}
            columns={[
              { field: 'booking_id', headerName: 'ID' },
              { field: 'booking_date', headerName: 'Date', type: 'date' },
              { field: 'status', headerName: 'Status', type: 'status' },
              { field: 'amount', headerName: 'Amount', type: 'currency' },
              { field: 'company_id', headerName: 'Company' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
      <Grid item xs={12}>
        <DashboardCard title="Payments" variant="outlined" headerAction={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <ModernSelect label="Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...companies.map(c => ({ value: c.company_id, label: c.name }))]} />
            <ModernTextField label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            <ModernTextField label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
            <ModernTextField label="Payment ID" value={paymentIdSearch} onChange={e => setPaymentIdSearch(e.target.value)} />
            <ModernButton variant="outlined" icon="download" onClick={() => exportCSV(filteredPayments, 'payments.csv')}>Export CSV</ModernButton>
          </Box>
        }>
          <DataTable
            data={filteredPayments}
            loading={loading}
            columns={[
              { field: 'payment_id', headerName: 'ID' },
              { field: 'created_at', headerName: 'Date', type: 'date' },
              { field: 'status', headerName: 'Status', type: 'status' },
              { field: 'amount', headerName: 'Amount', type: 'currency' },
              { field: 'company_id', headerName: 'Company' },
            ]}
            searchable
            pagination
          />
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
