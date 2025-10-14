import { useState, useEffect } from 'react';
import {
  Grid, TextField, Button, Alert, Box, Card, CardContent, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Switch, FormControlLabel
} from '@mui/material';
import { 
  Save as SaveIcon, Lock as LockIcon, Security as SecurityIcon 
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function ProfileForm({ userProfile, loading, onUpdate }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    company: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        role: userProfile.role || '',
        company: userProfile.company_name || ''
      });
      setMfaEnabled(userProfile.mfa_enabled || false);
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (!form.name.trim() || !form.email.trim()) {
        setError('Name and email are required');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: form.name.trim(),
          phone: form.phone.trim() || null
        })
        .eq('user_id', userProfile.user_id);

      if (updateError) throw updateError;

      setSuccess('Profile updated successfully!');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setChangingPassword(true);
      setError('');

      if (!passwordForm.currentPassword || !passwordForm.newPassword) {
        setError('Please fill in all password fields');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordModal(false);
      setSuccess('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Error changing password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleMfaToggle = async (enabled) => {
    try {
      setMfaEnabled(enabled);
      
      // In a real implementation, you would handle MFA setup/disable here
      // For now, we'll just update the local state and show a message
      
      if (enabled) {
        alert('MFA setup would be initiated here. Please scan the QR code with your authenticator app.');
      } else {
        alert('MFA has been disabled for your account.');
      }

      // Update user record
      const { error } = await supabase
        .from('users')
        .update({ mfa_enabled: enabled })
        .eq('user_id', userProfile.user_id);

      if (error) throw error;

      setSuccess(`Multi-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating MFA:', error);
      setError('Error updating MFA settings: ' + error.message);
      setMfaEnabled(!enabled); // Revert on error
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      disabled={loading || saving}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={form.email}
                      disabled
                      helperText="Email cannot be changed from this interface"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      disabled={loading || saving}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={form.role}
                      disabled
                      helperText="Role is managed by administrators"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company"
                      value={form.company}
                      disabled
                      helperText="Company assignment is managed by administrators"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={loading || saving}
                    >
                      {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Account Security */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SecurityIcon sx={{ mr: 1 }} />
                Account Security
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setShowPasswordModal(true)}
                    disabled={loading}
                    fullWidth
                  >
                    Change Password
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mfaEnabled}
                        onChange={(e) => handleMfaToggle(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Enable Multi-Factor Authentication"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onClose={() => setShowPasswordModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                disabled={changingPassword}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                disabled={changingPassword}
                helperText="Password must be at least 8 characters long"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                disabled={changingPassword}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowPasswordModal(false)} 
            disabled={changingPassword}
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained" 
            disabled={changingPassword}
          >
            {changingPassword ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
