import React, { useEffect, useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function StaffRBACTab() {
  const [staff, setStaff] = useState([]);
  const [perm, setPerm] = useState({});
  const companyId = window.companyId || localStorage.getItem('companyId');

  const load = async () => {
    const { data } = await supabase.from('users').select('user_id, name, role').eq('company_id', companyId).in('role', ['mechanic','cleaner','specialist','inspector','inventory','trainee','supervisor']);
    setStaff(data || []);
  };
  useEffect(() => { load(); }, [companyId]);

  const savePermissions = async () => {
    // Save to table maintenance_permissions(user_id, module, can_view)
    const rows = Object.entries(perm).flatMap(([uid, modules]) => Object.entries(modules).map(([m, v]) => ({ user_id: uid, module: m, can_view: !!v, company_id: companyId })));
    if (rows.length) {
      await supabase.from('maintenance_permissions').upsert(rows, { onConflict: 'user_id,module' });
      alert('Permissions saved');
    }
  };

  const toggle = (uid, module) => setPerm(p => ({ ...p, [uid]: { ...(p[uid]||{}), [module]: !(p[uid]?.[module]) } }));

  return (
    <Box>
      <DashboardCard title="Staff" variant="outlined">
        <DataTable data={staff} columns={[{ field: 'name', headerName: 'Name' }, { field: 'role', headerName: 'Role' }]} searchable pagination />
      </DashboardCard>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Permissions Matrix" variant="outlined" action={<Button variant="contained" onClick={savePermissions}>Save</Button>}>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {staff.map(s => (
              <Box key={s.user_id} sx={{ display: 'grid', gridTemplateColumns: '160px repeat(6, 120px)', gap: 1, alignItems: 'center' }}>
                <div>{s.name}</div>
                {['cleaning','engine','electrical','inspection','inventory','reports'].map(m => (
                  <Button key={m} variant={perm[s.user_id]?.[m] ? 'contained' : 'outlined'} size="small" onClick={() => toggle(s.user_id, m)}>{m}</Button>
                ))}
              </Box>
            ))}
          </Box>
        </DashboardCard>
      </Box>
      <Box sx={{ mt: 2 }}>
        <DashboardCard title="Assign Task" variant="outlined" action={<Button variant="contained" onClick={async () => { const staffId = prompt('Staff ID'); const bus = prompt('Bus ID'); const title = prompt('Task'); if (!staffId||!bus||!title) return; await supabase.from('maintenance_tasks').insert({ company_id: companyId, staff_id: staffId, bus_id: bus, title, status: 'pending' }); alert('Task assigned'); }}>Assign</Button>}>
          <div>Quickly assign a maintenance task to staff.</div>
        </DashboardCard>
      </Box>
    </Box>
  );
}
