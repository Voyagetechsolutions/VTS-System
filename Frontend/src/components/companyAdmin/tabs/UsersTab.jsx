import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button, TextField, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Stack, Divider, Chip, Tooltip, Box } from '@mui/material';
import { getCompanyUsers, createUser, updateUser, deleteUser, getBranches } from '../../../database';
import { requireString, requireEmail } from '../../../utils/validation';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'driver', is_active: true, password_hash: '', branch_id: '' });
  const [branches, setBranches] = useState([]);
  const [empOpen, setEmpOpen] = useState(false);
  const [empForm, setEmpForm] = useState({
    full_name: '', id_passport: '', address: '', phone: '', emergency_contact: { name: '', relation: '', phone: '' },
    employer: { company_name: '', registration_no: '', address: '', contact: '' },
    job: { title: '', description: '', location: '', hours: '' },
    compensation: { salary: '', frequency: 'monthly', overtime_rate: '', bonuses: '', benefits: '' },
    leave_entitlements: { annual: '', sick: '', maternity: '', paternity: '', public_holidays: '' },
    contract: { type: 'permanent', start_date: '', end_date: '', notice_period: '', termination_grounds: '' },
    other_terms: { confidentiality: true, non_compete: false, disciplinary: '', dispute_resolution: '' },
  });

  useEffect(() => {
    getCompanyUsers().then(({ data }) => setUsers(data || []));
    getBranches().then(({ data }) => setBranches(data || []));
  }, []);

  const loadVerification = async () => {
    try {
      const ids = (users || []).map(u => u.user_id).filter(Boolean);
      if (ids.length === 0) return;
      const url = `${process.env.REACT_APP_SUPABASE_URL || ''}/functions/v1/admin_user_status`;
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(window.supabase && (await window.supabase.auth.getSession()).data?.session?.access_token) || ''}` }, body: JSON.stringify({ user_ids: ids }) });
      const json = await resp.json();
      if (json?.users) {
        setUsers(prev => prev.map(u => ({ ...u, email_confirmed_at: json.users[u.user_id]?.email_confirmed_at || null })));
      }
    } catch {}
  };

  useEffect(() => { if (users.length) loadVerification(); }, [users.length]);

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes((search||'').toLowerCase()) &&
    ((emailSearch||'') === '' ? true : (u.email||'').toLowerCase().includes(emailSearch.toLowerCase())) &&
    (role ? u.role === role : true)
  );

  const exportCSV = () => {
    const rows = filtered;
    if (!rows?.length) return;
    const headers = ['name','email','role','is_active'];
    const lines = [headers.join(',')].concat(rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const openNew = () => { setEditing(null); setForm({ name: '', email: '', role: 'driver', is_active: true, password_hash: '', branch_id: '' }); setDialogOpen(true); };
  const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role, is_active: !!u.is_active, password_hash: '', branch_id: u.branch_id || '' }); setDialogOpen(true); };
  const save = async () => {
    try {
      const name = requireString(form.name, 'Name');
      const email = requireEmail(form.email);
      const role = requireString(form.role, 'Role');
      if (role !== 'driver' && !form.branch_id) { throw new Error('Branch is required for non-driver roles'); }
      if (editing) {
        await updateUser(editing.user_id, { name, email, role, is_active: !!form.is_active, branch_id: form.branch_id ? Number(form.branch_id) : null });
      } else {
        const plain = String(form.password_hash || '');
        await createUser({
          name,
          email,
          role,
          is_active: !!form.is_active,
          password_plain: plain,
          created_by: 'admin',
          company_id: window.companyId ? Number(window.companyId) : null,
          branch_id: form.branch_id ? Number(form.branch_id) : null
        });
      }
      setDialogOpen(false);
      setEditing(null);
      setForm({ name: '', email: '', role: 'driver', is_active: true, password_hash: '', branch_id: '' });
      getCompanyUsers().then(({ data }) => setUsers(data || []));
    } catch (e) {
      alert(e?.message || 'Validation failed');
    }
  };

  const openEmployee = (u) => { setEditing(u); setEmpOpen(true); };
  const saveEmployee = async () => {
    const payload = {
      user_id: editing.user_id,
      company_id: editing.company_id || window.companyId,
      full_name: empForm.full_name || editing.name,
      id_passport: empForm.id_passport || null,
      address: empForm.address || null,
      phone: empForm.phone || null,
      emergency_contact: empForm.emergency_contact,
      employer: empForm.employer,
      job: empForm.job,
      compensation: empForm.compensation,
      leave_entitlements: empForm.leave_entitlements,
      contract: empForm.contract,
      other_terms: empForm.other_terms,
    };
    await window.supabase.from('employee_profiles').upsert(payload, { onConflict: 'user_id' });
    setEmpOpen(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <TextField label="Search Name" value={search} onChange={e => setSearch(e.target.value)} />
        <TextField label="Search Email" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} />
        <Select value={role} onChange={e => setRole(e.target.value)} displayEmpty>
          <MenuItem value="">All Roles</MenuItem>
          <MenuItem value="driver">Driver</MenuItem>
          <MenuItem value="booking_officer">Booking Office</MenuItem>
          <MenuItem value="boarding_operator">Boarding Operator</MenuItem>
          <MenuItem value="ops_manager">Operations Manager</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
        <Button variant="contained" color="primary" onClick={openNew}>Add User</Button>
        <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Branch</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u) => (
            <TableRow key={u.user_id}>
              <TableCell>{u.name}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={1} alignItems="center">
                  <span>{u.email}</span>
                  {!u.email_confirmed_at && (
                    <Tooltip title="Verification pending">
                      <Chip size="small" label="Pending" color="warning" />
                    </Tooltip>
                  )}
                </Stack>
              </TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>{u.branch_id || '-'}</TableCell>
              <TableCell>{u.is_active ? 'Active' : 'Inactive'}</TableCell>
              <TableCell>
                <Button size="small" variant="outlined" onClick={() => openEmployee(u)}>Actions</Button>
                <IconButton onClick={() => openEdit(u)}><EditIcon /></IconButton>
                {!u.email_confirmed_at && (
                  <Button size="small" onClick={async () => {
                    try {
                      const url = `${process.env.REACT_APP_SUPABASE_URL || ''}/functions/v1/admin_resend_invite`;
                      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${(window.supabase && (await window.supabase.auth.getSession()).data?.session?.access_token) || ''}` }, body: JSON.stringify({ email: u.email }) });
                    } catch {}
                  }}>Resend invite</Button>
                )}
                <IconButton onClick={async () => { await deleteUser(u.user_id); try { await window.supabase.from('activity_log').insert([{ company_id: window.companyId, type: 'user_delete', message: JSON.stringify({ user_id: u.user_id, by: window.userId }) }]); } catch {} getCompanyUsers().then(({ data }) => setUsers(data || [])); }}><DeleteIcon /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => setRowsPerPage(parseInt(e.target.value, 10))}
      />
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth sx={{ mt: 1 }} />
          <TextField label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} fullWidth sx={{ mt: 2 }} />
          <Select fullWidth value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} sx={{ mt: 2 }}>
            <MenuItem value="driver">Driver</MenuItem>
            <MenuItem value="booking_officer">Booking Office</MenuItem>
            <MenuItem value="boarding_operator">Boarding Operator</MenuItem>
            <MenuItem value="ops_manager">Operations Manager</MenuItem>
          </Select>
          <Select fullWidth value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))} sx={{ mt: 2 }} displayEmpty>
            <MenuItem value="">{form.role === 'driver' ? 'Branch (optional for drivers)' : 'Select Branch (required)'}</MenuItem>
            {(branches||[]).map(b => <MenuItem key={b.branch_id} value={b.branch_id}>{b.name}</MenuItem>)}
          </Select>
          {!editing && <TextField label="Password" type="password" value={form.password_hash} onChange={e => setForm(f => ({ ...f, password_hash: e.target.value }))} fullWidth sx={{ mt: 2 }} helperText="In test mode, this is stored locally only" />}
          <Select fullWidth value={form.is_active ? 'Active' : 'Inactive'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'Active' }))} sx={{ mt: 2 }}>
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={empOpen} onClose={() => setEmpOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Divider>Employee details</Divider>
            <TextField label="Full name" value={empForm.full_name} onChange={e => setEmpForm(f => ({ ...f, full_name: e.target.value }))} fullWidth />
            <TextField label="ID/Passport" value={empForm.id_passport} onChange={e => setEmpForm(f => ({ ...f, id_passport: e.target.value }))} fullWidth />
            <TextField label="Address" value={empForm.address} onChange={e => setEmpForm(f => ({ ...f, address: e.target.value }))} fullWidth />
            <TextField label="Phone" value={empForm.phone} onChange={e => setEmpForm(f => ({ ...f, phone: e.target.value }))} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Emergency Name" value={empForm.emergency_contact.name} onChange={e => setEmpForm(f => ({ ...f, emergency_contact: { ...f.emergency_contact, name: e.target.value } }))} fullWidth />
              <TextField label="Relation" value={empForm.emergency_contact.relation} onChange={e => setEmpForm(f => ({ ...f, emergency_contact: { ...f.emergency_contact, relation: e.target.value } }))} fullWidth />
              <TextField label="Phone" value={empForm.emergency_contact.phone} onChange={e => setEmpForm(f => ({ ...f, emergency_contact: { ...f.emergency_contact, phone: e.target.value } }))} fullWidth />
            </Stack>

            <Divider>Employer details</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Company name" value={empForm.employer.company_name} onChange={e => setEmpForm(f => ({ ...f, employer: { ...f.employer, company_name: e.target.value } }))} fullWidth />
              <TextField label="Registration #" value={empForm.employer.registration_no} onChange={e => setEmpForm(f => ({ ...f, employer: { ...f.employer, registration_no: e.target.value } }))} fullWidth />
            </Stack>
            <TextField label="Business address" value={empForm.employer.address} onChange={e => setEmpForm(f => ({ ...f, employer: { ...f.employer, address: e.target.value } }))} fullWidth />
            <TextField label="Contact details" value={empForm.employer.contact} onChange={e => setEmpForm(f => ({ ...f, employer: { ...f.employer, contact: e.target.value } }))} fullWidth />

            <Divider>Job details</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Title/Position" value={empForm.job.title} onChange={e => setEmpForm(f => ({ ...f, job: { ...f.job, title: e.target.value } }))} fullWidth />
              <TextField label="Location(s)" value={empForm.job.location} onChange={e => setEmpForm(f => ({ ...f, job: { ...f.job, location: e.target.value } }))} fullWidth />
            </Stack>
            <TextField label="Job description" value={empForm.job.description} onChange={e => setEmpForm(f => ({ ...f, job: { ...f.job, description: e.target.value } }))} fullWidth multiline minRows={2} />
            <TextField label="Working hours" value={empForm.job.hours} onChange={e => setEmpForm(f => ({ ...f, job: { ...f.job, hours: e.target.value } }))} fullWidth />

            <Divider>Compensation & benefits</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Salary" value={empForm.compensation.salary} onChange={e => setEmpForm(f => ({ ...f, compensation: { ...f.compensation, salary: e.target.value } }))} fullWidth />
              <TextField label="Frequency" value={empForm.compensation.frequency} onChange={e => setEmpForm(f => ({ ...f, compensation: { ...f.compensation, frequency: e.target.value } }))} fullWidth />
              <TextField label="Overtime rate" value={empForm.compensation.overtime_rate} onChange={e => setEmpForm(f => ({ ...f, compensation: { ...f.compensation, overtime_rate: e.target.value } }))} fullWidth />
            </Stack>
            <TextField label="Bonuses/Commissions" value={empForm.compensation.bonuses} onChange={e => setEmpForm(f => ({ ...f, compensation: { ...f.compensation, bonuses: e.target.value } }))} fullWidth />
            <TextField label="Benefits" value={empForm.compensation.benefits} onChange={e => setEmpForm(f => ({ ...f, compensation: { ...f.compensation, benefits: e.target.value } }))} fullWidth />

            <Divider>Leave entitlements</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Annual" value={empForm.leave_entitlements.annual} onChange={e => setEmpForm(f => ({ ...f, leave_entitlements: { ...f.leave_entitlements, annual: e.target.value } }))} fullWidth />
              <TextField label="Sick" value={empForm.leave_entitlements.sick} onChange={e => setEmpForm(f => ({ ...f, leave_entitlements: { ...f.leave_entitlements, sick: e.target.value } }))} fullWidth />
              <TextField label="Maternity" value={empForm.leave_entitlements.maternity} onChange={e => setEmpForm(f => ({ ...f, leave_entitlements: { ...f.leave_entitlements, maternity: e.target.value } }))} fullWidth />
              <TextField label="Paternity" value={empForm.leave_entitlements.paternity} onChange={e => setEmpForm(f => ({ ...f, leave_entitlements: { ...f.leave_entitlements, paternity: e.target.value } }))} fullWidth />
              <TextField label="Public holidays" value={empForm.leave_entitlements.public_holidays} onChange={e => setEmpForm(f => ({ ...f, leave_entitlements: { ...f.leave_entitlements, public_holidays: e.target.value } }))} fullWidth />
            </Stack>

            <Divider>Duration & termination</Divider>
            <Stack direction="row" spacing={2}>
              <TextField label="Type" value={empForm.contract.type} onChange={e => setEmpForm(f => ({ ...f, contract: { ...f.contract, type: e.target.value } }))} fullWidth />
              <TextField label="Start date" type="date" InputLabelProps={{ shrink: true }} value={empForm.contract.start_date} onChange={e => setEmpForm(f => ({ ...f, contract: { ...f.contract, start_date: e.target.value } }))} fullWidth />
              <TextField label="End date" type="date" InputLabelProps={{ shrink: true }} value={empForm.contract.end_date} onChange={e => setEmpForm(f => ({ ...f, contract: { ...f.contract, end_date: e.target.value } }))} fullWidth />
              <TextField label="Notice period" value={empForm.contract.notice_period} onChange={e => setEmpForm(f => ({ ...f, contract: { ...f.contract, notice_period: e.target.value } }))} fullWidth />
            </Stack>
            <TextField label="Grounds for termination" value={empForm.contract.termination_grounds} onChange={e => setEmpForm(f => ({ ...f, contract: { ...f.contract, termination_grounds: e.target.value } }))} fullWidth />

            <Divider>Other terms</Divider>
            <TextField label="Disciplinary procedures" value={empForm.other_terms.disciplinary} onChange={e => setEmpForm(f => ({ ...f, other_terms: { ...f.other_terms, disciplinary: e.target.value } }))} fullWidth />
            <TextField label="Dispute resolution" value={empForm.other_terms.dispute_resolution} onChange={e => setEmpForm(f => ({ ...f, other_terms: { ...f.other_terms, dispute_resolution: e.target.value } }))} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmpOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveEmployee}>Save</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
