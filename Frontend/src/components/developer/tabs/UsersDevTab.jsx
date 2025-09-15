import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { getAllUsersGlobal, deactivateUserGlobal, getCompaniesLight, updateUserRoleGlobal } from '../../../supabase/api';
import { Box } from '@mui/material';
import { ModernSelect, ModernTextField, ModernButton } from '../../common/FormComponents';

function toCSV(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  return lines.join('\n');
}

export default function UsersDevTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await getAllUsersGlobal();
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
    (roleFilter ? r.role === roleFilter : true) &&
    (statusFilter ? (statusFilter === 'active' ? r.is_active : !r.is_active) : true) &&
    ((searchName || '').trim() === '' ? true : (r.name || '').toLowerCase().includes(searchName.toLowerCase())) &&
    ((searchEmail || '').trim() === '' ? true : (r.email || '').toLowerCase().includes(searchEmail.toLowerCase())) &&
    inRange(r.last_login)
  ));

  const exportCSV = () => {
    if (!filtered.length) return;
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = [
    { label: 'Deactivate', icon: 'error', color: 'error', onClick: async ({ row }) => { await deactivateUserGlobal(row.user_id); load(); } },
    { label: 'Reset Role', icon: 'key', onClick: async ({ row }) => { const role = prompt('New Role (admin/ops_manager/booking_officer/driver/developer):', row.role); if (!role) return; await updateUserRoleGlobal(row.user_id, role); load(); } },
  ];

  return (
    <DashboardCard title="Users" variant="outlined" headerAction={
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <ModernSelect label="Company" value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} options={[{ value: '', label: 'All' }, ...companies.map(c => ({ value: c.company_id, label: c.name }))]} />
        <ModernSelect label="Role" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} options={[{ value: '', label: 'All' }, 'admin','ops_manager','booking_officer','driver','developer'].map(r => typeof r === 'string' ? ({ value: r, label: r }) : r)} />
        <ModernSelect label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        <ModernTextField label="From (Last Login)" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <ModernTextField label="To (Last Login)" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
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
          { field: 'email', headerName: 'Email', sortable: true },
          { field: 'role', headerName: 'Role' },
          { field: 'company_id', headerName: 'Company' },
          { field: 'is_active', headerName: 'Status', type: 'status' },
          { field: 'last_login', headerName: 'Last Login', type: 'date' },
        ]}
        rowActions={actions.map(a => ({ ...a, onClick: (row) => a.onClick({ row }) }))}
        searchable
        pagination
      />
    </DashboardCard>
  );
}
