import React, { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import { ModernTextField, ModernButton, ModernSwitch, FormSection, FormRow } from '../../common/FormComponents';
import { getPlatformSettings, upsertPlatformSettings } from '../../../supabase/api';

export default function SettingsDevTab() {
  const [branding, setBranding] = useState({ name: 'VTS System', primaryColor: '#0c8ce9', logoUrl: '' });
  const [security, setSecurity] = useState({ mfaRequired: false });

  useEffect(() => {
    (async () => {
      const res = await getPlatformSettings();
      if (res?.data) {
        setBranding({ name: res.data.name || 'VTS System', primaryColor: res.data.primary_color || '#0c8ce9', logoUrl: res.data.logo_url || '' });
        setSecurity({ mfaRequired: !!res.data.mfa_required });
      }
    })();
  }, []);

  const saveBranding = async () => {
    await upsertPlatformSettings({ id: 1, name: branding.name, primary_color: branding.primaryColor, logo_url: branding.logoUrl });
  };

  const saveSecurity = async () => {
    await upsertPlatformSettings({ id: 1, mfa_required: security.mfaRequired });
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Platform Branding" variant="outlined">
          <FormSection>
            <FormRow>
              <ModernTextField label="Platform Name" value={branding.name} onChange={e => setBranding(b => ({ ...b, name: e.target.value }))} />
            </FormRow>
            <FormRow>
              <ModernTextField label="Primary Color" value={branding.primaryColor} onChange={e => setBranding(b => ({ ...b, primaryColor: e.target.value }))} />
            </FormRow>
            <FormRow>
              <ModernTextField label="Logo URL" value={branding.logoUrl} onChange={e => setBranding(b => ({ ...b, logoUrl: e.target.value }))} />
            </FormRow>
            <ModernButton variant="contained" icon="save" onClick={saveBranding}>Save</ModernButton>
          </FormSection>
        </DashboardCard>
      </Grid>
      <Grid item xs={12} md={6}>
        <DashboardCard title="Security Settings" variant="outlined">
          <FormSection>
            <FormRow>
              <ModernSwitch label="Require MFA for Admins" checked={security.mfaRequired} onChange={e => setSecurity(s => ({ ...s, mfaRequired: e.target.checked }))} />
            </FormRow>
            <ModernButton variant="contained" icon="save" onClick={saveSecurity}>Save</ModernButton>
          </FormSection>
        </DashboardCard>
      </Grid>
    </Grid>
  );
}
