import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard, { StatsCard } from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function OverviewTab() {
  const [kpis, setKpis] = useState({ revenueToday: 0, revenueMonth: 0, expensesMonth: 0, refundsPending: 0, profitMonth: 0 });
  const [revVsExp, setRevVsExp] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => { (async () => {
    try {
      // Basic KPIs approximation using available tables
      const startMonth = new Date(); startMonth.setDate(1); startMonth.setHours(0,0,0,0);
      const startDay = new Date(); startDay.setHours(0,0,0,0);
      const [{ data: payToday }, { data: payMonth }, { data: expMonth }, { data: refunds } ] = await Promise.all([
        supabase.from('payments').select('amount').eq('company_id', companyId).gte('created_at', startDay.toISOString()),
        supabase.from('payments').select('amount').eq('company_id', companyId).gte('created_at', startMonth.toISOString()),
        supabase.from('expenses').select('amount').eq('company_id', companyId).gte('created_at', startMonth.toISOString()),
        supabase.from('refunds').select('id').eq('company_id', companyId).eq('status', 'pending'),
      ]);
      const revenueToday = (payToday||[]).reduce((s, r) => s + (Number(r.amount)||0), 0);
      const revenueMonth = (payMonth||[]).reduce((s, r) => s + (Number(r.amount)||0), 0);
      const expensesMonth = (expMonth||[]).reduce((s, r) => s + (Number(r.amount)||0), 0);
      const profitMonth = revenueMonth - expensesMonth;
      setKpis({ revenueToday, revenueMonth, expensesMonth, refundsPending: (refunds||[]).length, profitMonth });

      setRevVsExp([
        { label: 'Revenue (Month)', amount: revenueMonth },
        { label: 'Expenses (Month)', amount: expensesMonth },
        { label: 'Profit (Month)', amount: profitMonth },
      ]);
    } catch {}
  })(); }, [companyId]);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}><StatsCard title="Revenue Today" value={kpis.revenueToday} trend={{ direction: 'up' }} /></Grid>
      <Grid item xs={12} md={3}><StatsCard title="Revenue (Month)" value={kpis.revenueMonth} /></Grid>
      <Grid item xs={12} md={3}><StatsCard title="Expenses (Month)" value={kpis.expensesMonth} /></Grid>
      <Grid item xs={12} md={3}><StatsCard title="Pending Refunds" value={kpis.refundsPending} /></Grid>

      <Grid item xs={12} md={8}>
        <DashboardCard title="Revenue vs Expenses" variant="elevated">
          <DataTable data={revVsExp} columns={[{ field: 'label', headerName: 'Metric' }, { field: 'amount', headerName: 'Amount', type: 'currency' }]} pagination={false} />
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={4}>
        <DashboardCard title="Quick Actions" variant="elevated">
          <ModernButton icon="download" onClick={async () => {
            try {
              const amountStr = window.prompt('Invoice amount');
              const amount = Number(amountStr || 0);
              const customer = window.prompt('Customer name (optional)') || null;
              if (!amount || Number.isNaN(amount)) return;
              await supabase.from('invoices').insert([{ company_id: window.companyId, amount, status: 'Issued', customer_name: customer, issued_at: new Date().toISOString() }]);
            } catch {}
          }}>Generate Invoice</ModernButton>
          <ModernButton icon="check" onClick={async () => {
            try { await supabase.from('hr_payroll').update({ status: 'approved' }).eq('company_id', window.companyId).eq('status', 'pending'); } catch {}
          }}>Approve Payroll</ModernButton>
          <ModernButton icon="add" onClick={async () => {
            try {
              const category = window.prompt('Expense category (fuel, maintenance, salaries, overhead)') || 'other';
              const amountStr = window.prompt('Expense amount');
              const amount = Number(amountStr || 0);
              if (!amount || Number.isNaN(amount)) return;
              await supabase.from('expenses').insert([{ company_id: window.companyId, category, amount, created_at: new Date().toISOString() }]);
            } catch {}
          }}>Add Expense</ModernButton>
          <ModernButton icon="cancel" onClick={async () => {
            try {
              const bookingId = window.prompt('Booking ID to refund');
              const amountStr = window.prompt('Refund amount');
              const amount = Number(amountStr || 0);
              if (!bookingId || !amount || Number.isNaN(amount)) return;
              await supabase.from('refunds').insert([{ company_id: window.companyId, booking_id: bookingId, amount, status: 'pending' }]);
            } catch {}
          }}>Process Refund</ModernButton>
        </DashboardCard>
      </Grid>
    </Grid>
  );
}


