import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Tabs, Tab
} from '@mui/material';
import {
  Business as CompanyIcon, Settings as SystemIcon, Extension as IntegrationIcon,
  Security as SecurityIcon, Person as ProfileIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import CompanyInfoForm from '../components/CompanyInfoForm';
import SystemPreferencesForm from '../components/SystemPreferencesForm';
import IntegrationsForm from '../components/IntegrationsForm';
import RolesTable from '../components/RolesTable';
import ProfileForm from '../components/ProfileForm';

export default function SystemSettingsHubTab() {
  const [tabValue, setTabValue] = useState(0);
  const [companySettings, setCompanySettings] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const companyId = window.companyId || localStorage.getItem('companyId');
  const currentUserId = window.userId || localStorage.getItem('userId');

  const loadCompanySettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('id', companyId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCompanySettings(data);
    } catch (error) {
      console.error('Error loading company settings:', error);
    }
  }, [companyId]);

  const loadUserProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, [currentUserId]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCompanySettings(),
        loadUserProfile()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadCompanySettings, loadUserProfile]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleSettingsUpdate = () => {
    loadCompanySettings();
  };

  const handleProfileUpdate = () => {
    loadUserProfile();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings & Profile
        </Typography>
      </Box>

      {/* Settings Tabs */}
      <Card>
        <CardContent>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)} 
            sx={{ mb: 3 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<CompanyIcon />} 
              label="Company Info" 
              iconPosition="start"
            />
            <Tab 
              icon={<SystemIcon />} 
              label="System Preferences" 
              iconPosition="start"
            />
            <Tab 
              icon={<IntegrationIcon />} 
              label="Integrations" 
              iconPosition="start"
            />
            <Tab 
              icon={<SecurityIcon />} 
              label="Roles & Access" 
              iconPosition="start"
            />
            <Tab 
              icon={<ProfileIcon />} 
              label="Profile & Account" 
              iconPosition="start"
            />
          </Tabs>

          {/* Company Information Tab */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your company's basic information, contact details, and branding.
              </Typography>
              <CompanyInfoForm 
                companySettings={companySettings}
                loading={loading}
                onUpdate={handleSettingsUpdate}
              />
            </Box>
          )}

          {/* System Preferences Tab */}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                System Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure system-wide settings like currency, timezone, language, and date formats.
              </Typography>
              <SystemPreferencesForm 
                companySettings={companySettings}
                loading={loading}
                onUpdate={handleSettingsUpdate}
              />
            </Box>
          )}

          {/* Integrations Tab */}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Integrations & API Keys
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage external service integrations and API configurations.
              </Typography>
              <IntegrationsForm 
                companySettings={companySettings}
                loading={loading}
                onUpdate={handleSettingsUpdate}
              />
            </Box>
          )}

          {/* Roles & Access Control Tab */}
          {tabValue === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Roles & Access Control
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage user roles, permissions, and module visibility settings.
              </Typography>
              <RolesTable 
                loading={loading}
              />
            </Box>
          )}

          {/* Profile & Account Tab */}
          {tabValue === 4 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Profile & Account Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal information and account security settings.
              </Typography>
              <ProfileForm 
                userProfile={userProfile}
                loading={loading}
                onUpdate={handleProfileUpdate}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
