import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function ComposeMessageModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    recipient_id: '',
    message: ''
  });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');
  const currentUserId = window.userId || localStorage.getItem('userId');

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, name, email, role')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .neq('user_id', currentUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.recipient_id || !form.message.trim()) {
        setError('Please select a recipient and enter a message');
        return;
      }

      const { error: insertError } = await supabase.from('messages').insert([{
        company_id: companyId,
        sender_id: currentUserId,
        recipient_id: form.recipient_id,
        message: form.message.trim(),
        status: 'unread'
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        recipient_id: '',
        message: ''
      });

      onSuccess();
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Error sending message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        recipient_id: '',
        message: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Compose Message</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Recipient</InputLabel>
              <Select
                value={form.recipient_id}
                label="Recipient"
                onChange={(e) => setForm({ ...form, recipient_id: e.target.value })}
                disabled={loading}
              >
                {users.map((user) => (
                  <MenuItem key={user.user_id} value={user.user_id}>
                    {user.name} ({user.role}) - {user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Message"
              multiline
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              disabled={loading}
              placeholder="Type your message here..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
