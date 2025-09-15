import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton, ModernTextField } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { sendInvoiceReminder } from '../../../supabase/api';

export default function InvoicingTab() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => {
    let q = supabase.from('invoices').select('*').eq('company_id', companyId);
    if (filter) q = q.ilike('customer_name', `%${filter}%`);
    const { data } = await q.order('created_at', { ascending: false });
    setRows(data||[]);
  };
  useEffect(() => { load(); }, [companyId, filter]);

  return (
    <DashboardCard title="Invoicing & Corporate Clients" variant="outlined">
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <ModernTextField label="Search Customer" value={filter} onChange={e => setFilter(e.target.value)} />
        <ModernButton icon="add" onClick={async ()=>{
          const customer = window.prompt('Customer name');
          const amtStr = window.prompt('Invoice amount');
          const amount = Number(amtStr || 0);
          const due = window.prompt('Due date (YYYY-MM-DD)') || null;
          if (!amount || Number.isNaN(amount)) return;
          await supabase.from('invoices').insert([{ company_id: window.companyId, customer_name: customer || null, amount, status: 'Issued', due_at: due ? new Date(due).toISOString() : null }]);
          load();
        }}>New Invoice</ModernButton>
        <ModernButton icon="refresh" onClick={load}>Refresh</ModernButton>
      </Box>
      <DataTable
        data={rows}
        columns={[
          { field: 'created_at', headerName: 'Date', type: 'date' },
          { field: 'customer_name', headerName: 'Customer' },
          { field: 'amount', headerName: 'Amount', type: 'currency' },
          { field: 'status', headerName: 'Status' },
          { field: 'due_date', headerName: 'Due', type: 'date' },
        ]}
        searchable
        pagination
        rowActions={[{ label: 'Send Reminder', icon: 'email', onClick: async (row) => { await sendInvoiceReminder(row.id); load(); } }, { label: 'Mark Paid', icon: 'check', onClick: async (row) => { await supabase.from('invoices').update({ status: 'Paid' }).eq('id', row.id); load(); } }]}
      />
    </DashboardCard>
  );
}


