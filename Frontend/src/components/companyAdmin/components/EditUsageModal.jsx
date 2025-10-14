import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditUsageModal({ open, onClose, onSuccess, usageItem }) {
  const [form, setForm] = useState({
    part_id: '',
    bus_id: '',
    date: '',
    quantity: '',
    notes: ''
  });
  const [buses, setBuses] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalQuantity, setOriginalQuantity] = useState(0);

  const companyId = window.companyId || localStorage.getItem('companyId');

  useEffect(() => {
    if (usageItem && open) {
      setForm({
        part_id: usageItem.part_id || '',
        bus_id: usageItem.bus_id || '',
        date: usageItem.date || '',
        quantity: usageItem.quantity?.toString() || '',
        notes: usageItem.notes || ''
      });
      setOriginalQuantity(usageItem.quantity || 0);
      loadData();
    }
  }, [usageItem, open]);

  const loadData = async () => {
    try {
      const [busesData, stockData] = await Promise.all([
        supabase.from('buses').select('id, name, license_plate').eq('company_id', companyId).order('name', { ascending: true }),
        supabase.from('inventory_stock').select('*').eq('company_id', companyId).order('part_name', { ascending: true })
      ]);

      setBuses(busesData.data || []);
      setStock(stockData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
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

      const newQuantity = parseInt(form.quantity);
      if (newQuantity <= 0) {
        setError('Quantity must be greater than 0');
        return;
      }

      // Calculate the difference in quantity used
      const quantityDifference = newQuantity - originalQuantity;
      
      // Check if there's enough stock for the increase
      if (quantityDifference > 0) {
        const selectedPart = stock.find(item => item.id === form.part_id);
        if (selectedPart && selectedPart.quantity < quantityDifference) {
          setError(`Not enough stock available for the increase. Available: ${selectedPart.quantity}`);
          return;
        }
      }

      // Update usage record
      const { error: updateError } = await supabase
        .from('inventory_usage')
        .update({
          part_id: form.part_id,
          bus_id: form.bus_id,
          date: form.date,
          quantity: newQuantity,
          notes: form.notes || null
        })
        .eq('id', usageItem.id);

      if (updateError) throw updateError;

      // Update stock quantity if there's a change
      if (quantityDifference !== 0) {
        const selectedPart = stock.find(item => item.id === form.part_id);
        if (selectedPart) {
          const updatedQuantity = selectedPart.quantity - quantityDifference;
          let newStatus = 'available';
          
          if (updatedQuantity === 0) {
            newStatus = 'out_of_stock';
          } else if (updatedQuantity <= (selectedPart.reorder_level || 0)) {
            newStatus = 'low';
          }

          const { error: stockUpdateError } = await supabase
            .from('inventory_stock')
            .update({
              quantity: updatedQuantity,
              status: newStatus
            })
            .eq('id', form.part_id);

          if (stockUpdateError) throw stockUpdateError;
        }
      }

      onSuccess();
      alert('Usage record updated successfully!');
    } catch (error) {
      console.error('Error updating usage:', error);
      setError('Error updating usage: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  const selectedPart = stock.find(item => item.id === form.part_id);
  const quantityDifference = parseInt(form.quantity || 0) - originalQuantity;
  const availableForIncrease = selectedPart ? selectedPart.quantity + Math.max(0, -quantityDifference) : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Usage Record</DialogTitle>
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
              inputProps={{ min: 1 }}
              helperText={`Available for increase: ${availableForIncrease}`}
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
          {loading ? 'Updating...' : 'Update Usage Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
