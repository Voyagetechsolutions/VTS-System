import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton, ModernTextField } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';

export default function TaxComplianceTab() {
  const [rows, setRows] = useState([]);
  const [region, setRegion] = useState('');
  const companyId = window.companyId || localStorage.getItem('companyId');
  const load = async () => {
    let q = supabase.from('tax_reports').select('*').eq('company_id', companyId);
    if (region) q = q.eq('region', region);
    const { data } = await q.order('period', { ascending: false });
    setRows(data||[]);
  };
  useEffect(() => { load(); }, [companyId, region]);

  return (
    <DashboardCard title="Taxation & Compliance" variant="outlined">
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <ModernTextField label="Region" value={region} onChange={e => setRegion(e.target.value)} />
        <ModernButton icon="download" onClick={async ()=>{
          const csv = ['period,region,vat,sales_tax,total'].concat((rows||[]).map(r=>[r.period,r.region,r.vat,r.sales_tax,r.total].join(','))).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'tax_report.csv'; a.click(); URL.revokeObjectURL(url);
        }}>Export Tax File</ModernButton>
        <ModernButton icon="add" onClick={async ()=>{
          const period = window.prompt('Period (YYYY-MM)');
          const reg = window.prompt('Region code') || region || null;
          const vat = Number(window.prompt('VAT total') || 0);
          const sales = Number(window.prompt('Sales tax total') || 0);
          if (!period) return;
          await supabase.from('tax_reports').insert([{ company_id: window.companyId, period, region: reg, vat, sales_tax: sales, total: vat + sales }]);
          load();
        }}>Add</ModernButton>
      </Box>
      <DataTable data={rows} columns={[{ field: 'period', headerName: 'Period' }, { field: 'region', headerName: 'Region' }, { field: 'vat', headerName: 'VAT', type: 'currency' }, { field: 'sales_tax', headerName: 'Sales Tax', type: 'currency' }, { field: 'total', headerName: 'Total', type: 'currency' }]} searchable pagination />
    </DashboardCard>
  );
}


