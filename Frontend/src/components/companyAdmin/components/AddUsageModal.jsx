import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddUsageModal({ open, onClose, onSuccess, stock }) {
  const [form, setForm] = useState({
    part_id: '',
    bus_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    notes: ''
  });
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (open) {
      loadBuses();
    }
  }, [open]);

  const loadBuses = async () => {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, license_plate')
        .eq('company_id', companyId)
        .order('name', { ascending: true });

      if (error) throw error;
      setBuses(data || []);
    } catch (error) {
      console.error('Error loading buses:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.part_id || !form.bus_id || !form.date || !form.quantity) {
        setError('Please fill in all required fields');
        return;
      }

      const quantity = parseInt(form.quantity);
      if (quantity <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }

      // Check if there's enough stock
      const selectedPart = stock.find(item => item.id === form.part_id);
      if (selectedPart && selectedPart.quantity < quantity) {
        setError(`Not enough stock available. Current stock: ${selectedPart.quantity}`);
        return;
      }

      // Insert usage record
      const { error: insertError } = await supabase.from('inventory_usage').insert([{
        company_id: companyId,
        part_id: form.part_id,
        bus_id: form.bus_id,
        date: form.date,
        quantity: quantity,
        notes: form.notes || null
      }]);

      if (insertError) throw insertError;

      // Update stock quantity
      if (selectedPart) {
        const newQuantity = selectedPart.quantity - quantity;
        let newStatus = 'available';
        
        if (newQuantity === 0) {
          newStatus = 'out_of_stock';
        } else if (newQuantity <= (selectedPart.reorder_level || 0)) {
          newStatus = 'low';
        }

        const { error: updateError } = await supabase
          .from('inventory_stock')
          .update({
            quantity: newQuantity,
            status: newStatus
          })
          .eq('id', form.part_id);

        if (updateError) throw updateError;
      }

      // Reset form
      setForm({
        part_id: '',
        bus_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        notes: ''
      });

      onSuccess();
      alert('Usage record added successfully!');
    } catch (error) {
      console.error('Error adding usage:', error);
      setError('Error adding usage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        part_id: '',
        bus_id: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        notes: ''
      });
      setError('');
      onClose();
    }
  };

  const selectedPart = stock.find(item => item.id === form.part_id);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Usage Record</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Part</InputLabel>
              <Select
                value={form.part_id}
                label="Part"
                onChange={(e) => setForm({ ...form, part_id: e.target.value })}
                disabled={loading}
              >
                {stock.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.part_name} ({item.part_number}) - Stock: {item.quantity}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Bus</InputLabel>
              <Select
                value={form.bus_id}
                label="Bus"
                onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                disabled={loading}
              >
                {buses.map((bus) => (
                  <MenuItem key={bus.id} value={bus.id}>
                    {bus.name} ({bus.license_plate})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity Used"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 1, max: selectedPart?.quantity || 999 }}
              helperText={selectedPart ? `Available: ${selectedPart.quantity}` : ''}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              disabled={loading}
              placeholder="Optional notes about the usage..."
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
          {loading ? 'Adding...' : 'Add Usage Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
