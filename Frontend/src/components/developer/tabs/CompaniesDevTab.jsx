import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DataTable from '../../common/DataTable';
import { getAllCompanies, verifyCompany, suspendCompany, changeCompanyPlan, getCompaniesLight } from '../../../supabase/api';
import DashboardCard from '../../common/DashboardCard';
import { ModernSelect, ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function CompaniesDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyFilter, setCompanyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await getAllCompanies();
    setRows(res.data || []);
    const cl = await getCompaniesLight();
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

  const filtered = rows.filter(r => (
    (companyFilter ? r.company_id === companyFilter : true) &&
    (statusFilter ? (statusFilter === 'active' ? r.is_active : !r.is_active) : true) &&
    ((searchName || '').trim() === '' ? true : (r.name || '').toLowerCase().includes(searchName.toLowerCase())) &&
    ((searchEmail || '').trim() === '' ? true : (r.email || '').toLowerCase().includes(searchEmail.toLowerCase())) &&
    inRange(r.created_at)
  ));

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = [
    { label: 'Verify', icon: 'verified', onClick: async ({ row }) => { await verifyCompany(row.company_id); load(); } },
    { label: 'Suspend', icon: 'warning', onClick: async ({ row }) => { await suspendCompany(row.company_id); load(); }, color: 'error' },
    { label: 'Change Plan', icon: 'revenue', onClick: async ({ row }) => { const plan = prompt('Plan (Basic/Pro/Enterprise):', 'Pro'); const amount = Number(prompt('Amount:', '0')) || 0; await changeCompanyPlan(row.company_id, plan, amount); load(); } },
  ];

  return (
    <DashboardCard title="Companies" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernSelect label="Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...companies.map(c => ({ value: c.company_id, label: c.name }))]} />
        <ModernSelect label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        <ModernTextField label="From" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <ModernTextField label="To" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <ModernTextField label="Search Name" value={searchName} onChange={e => setSearchName(e.target.value)} />
        <ModernTextField label="Search Email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
        <ModernButton variant="outlined" icon="download" onClick={exportCSV}>Export CSV</ModernButton>
      </Box>
    }>
      <DataTable
        data={filtered}
        loading={loading}
        columns={[
          { field: 'name', headerName: 'Name', sortable: true },
          { field: 'email', headerName: 'Email' },
          { field: 'created_at', headerName: 'Created', type: 'date', sortable: true },
          { field: 'is_active', headerName: 'Status', type: 'status' },
        ]}
        rowActions={actions.map(a => ({ ...a, onClick: (row) => a.onClick({ row }) }))}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
