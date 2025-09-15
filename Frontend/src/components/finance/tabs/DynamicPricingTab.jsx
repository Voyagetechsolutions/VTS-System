import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton, ModernTextField } from '../../common/FormComponents';
import { getDynamicPricingRules, listPromotions, computeDynamicPrice, applyPromo } from '../../../supabase/api';

export default function DynamicPricingTab() {
  const [rules, setRules] = useState([]);
  const [promos, setPromos] = useState([]);
  const [routeId, setRouteId] = useState('');
  const [base, setBase] = useState('');
  const [code, setCode] = useState('');
  const [computed, setComputed] = useState(null);
  const [discounted, setDiscounted] = useState(null);

  const load = async () => {
    const [{ data: r }, { data: p }] = await Promise.all([getDynamicPricingRules(), listPromotions()]);
    setRules(r || []);
    setPromos(p || []);
  };
  useEffect(() => { load(); }, []);

  const onCompute = async () => {
    const res = await computeDynamicPrice(routeId || null, Number(base || 0));
    setComputed(res?.data ?? null);
  };
  const onApplyPromo = async () => {
    const res = await applyPromo(code || '', Number(computed ?? base ?? 0));
    setDiscounted(res?.data ?? null);
  };

  return (
    <>
      <DashboardCard title="Dynamic Pricing Rules" variant="outlined">
        <DataTable data={rules} columns={[{ field: 'route_id', headerName: 'Route' }, { field: 'rule_type', headerName: 'Type' }, { field: 'price_multiplier', headerName: 'x Price' }, { field: 'starts_at', headerName: 'Starts' }, { field: 'ends_at', headerName: 'Ends' }]} searchable pagination />
      </DashboardCard>
      <DashboardCard title="Promotions" variant="outlined">
        <DataTable data={promos} columns={[{ field: 'code', headerName: 'Code' }, { field: 'description', headerName: 'Description' }, { field: 'discount_percent', headerName: '% Off' }, { field: 'discount_amount', headerName: 'Flat Off' }, { field: 'starts_at', headerName: 'Starts' }, { field: 'ends_at', headerName: 'Ends' }, { field: 'redeemed_count', headerName: 'Redeemed' }, { field: 'max_redemptions', headerName: 'Max' }]} searchable pagination />
      </DashboardCard>
      <DashboardCard title="Test Pricing" variant="elevated">
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <ModernTextField label="Route ID" value={routeId} onChange={e => setRouteId(e.target.value)} />
          <ModernTextField label="Base Price" type="number" value={base} onChange={e => setBase(e.target.value)} />
          <ModernButton onClick={onCompute}>Compute Dynamic Price</ModernButton>
          {computed != null && <Box sx={{ alignSelf: 'center' }}>Computed: {Number(computed).toFixed(2)}</Box>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <ModernTextField label="Promo Code" value={code} onChange={e => setCode(e.target.value)} />
          <ModernButton onClick={onApplyPromo}>Apply Promo</ModernButton>
          {discounted != null && <Box sx={{ alignSelf: 'center' }}>Discounted: {Number(discounted).toFixed(2)}</Box>}
        </Box>
      </DashboardCard>
    </>
  );
}


