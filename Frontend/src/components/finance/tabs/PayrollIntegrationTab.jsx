import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function PayrollIntegrationTab() {
  const [rows, setRows] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    // Expect an hr_payroll view/table (fallback to employees if absent)
    const { data } = await supabase.from('hr_payroll').select('*').eq('company_id', companyId).order('period', { ascending: false });
    setRows(data || []);
  })(); }, [companyId]);

  return (
    <DashboardCard title="Payroll & HR Integration" variant="outlined" subtitle="Approvals: HR → Finance → Disbursement">
      <Box sx={{ mb: 1, display: 'flex', gap: 1 }}>
        <ModernButton icon="download">Export Bank File</ModernButton>
        <ModernButton icon="check">Approve Selected</ModernButton>
      </Box>
      <DataTable
        data={rows}
        columns={[
          { field: 'period', headerName: 'Period' },
          { field: 'department', headerName: 'Department' },
          { field: 'employee_count', headerName: 'Employees' },
          { field: 'gross', headerName: 'Gross', type: 'currency' },
          { field: 'net', headerName: 'Net', type: 'currency' },
          { field: 'status', headerName: 'Status' },
        ]}
        searchable
        pagination
        rowSelection
      />
    </DashboardCard>
  );
}


