import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { markBillPaid } from '../../../supabase/api';

export default function VendorsPaymentsTab() {
  const [vendors, setVendors] = useState([]);
  const [bills, setBills] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: v }, { data: b }] = await Promise.all([
      supabase.from('vendors').select('*').eq('company_id', companyId).order('name'),
      supabase.from('bills').select('*').eq('company_id', companyId).order('due_date', { ascending: true }),
    ]);
    setVendors(v||[]); setBills(b||[]);
  })(); }, [companyId]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}><DashboardCard title="Vendors & Suppliers"><ModernButton icon="add" onClick={async ()=>{
        const name = window.prompt('Vendor name');
        const category = window.prompt('Category (fuel, maintenance, etc)') || null;
        const contact = window.prompt('Contact (email/phone)') || null;
        if (!name) return;
        await supabase.from('vendors').insert([{ company_id: companyId, name, category, contact }]);
        const { data: v } = await supabase.from('vendors').select('*').eq('company_id', companyId).order('name');
        setVendors(v || []);
      }}>Add Vendor</ModernButton><DataTable data={vendors} columns={[{ field: 'name', headerName: 'Name' }, { field: 'category', headerName: 'Category' }, { field: 'contact', headerName: 'Contact' }]} searchable pagination rowActions={[{ label: 'New Bill', icon: 'add', onClick: async (row)=>{
        const amtStr = window.prompt('Bill amount');
        const amount = Number(amtStr || 0);
        const due = window.prompt('Due date (YYYY-MM-DD)') || null;
        if (!amount || Number.isNaN(amount)) return;
        await supabase.from('bills').insert([{ company_id: companyId, vendor_id: row.id, vendor_name: row.name, amount, due_date: due }]);
        const { data: b } = await supabase.from('bills').select('*').eq('company_id', companyId).order('due_date', { ascending: true });
        setBills(b||[]);
      }}]} /></DashboardCard></Grid>
      <Grid item xs={12} md={7}><DashboardCard title="Bills & Payments"><DataTable data={bills} columns={[{ field: 'vendor_name', headerName: 'Vendor' }, { field: 'amount', headerName: 'Amount', type: 'currency' }, { field: 'due_date', headerName: 'Due', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Mark Paid', icon: 'check', onClick: async (row) => { await markBillPaid(row.id); const { data: b } = await supabase.from('bills').select('*').eq('company_id', companyId).order('due_date', { ascending: true }); setBills(b||[]); } }]} /></DashboardCard></Grid>
    </Grid>
  );
}


