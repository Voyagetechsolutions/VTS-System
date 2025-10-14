import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddStockModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    part_name: '',
    part_number: '',
    category: '',
    quantity: '',
    reorder_level: '',
    status: 'available'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.part_name || !form.part_number || !form.category || !form.quantity) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if part number already exists
      const { data: existingPart } = await supabase
        .from('inventory_stock')
        .select('id')
        .eq('part_number', form.part_number)
        .eq('company_id', companyId)
        .single();

      if (existingPart) {
        setError('A part with this part number already exists');
        return;
      }

      // Determine status based on quantity and reorder level
      const quantity = parseInt(form.quantity);
      const reorderLevel = parseInt(form.reorder_level) || 0;
      let status = 'available';
      
      if (quantity === 0) {
        status = 'out_of_stock';
      } else if (quantity <= reorderLevel) {
        status = 'low';
      }

      const { error: insertError } = await supabase.from('inventory_stock').insert([{
        company_id: companyId,
        part_name: form.part_name,
        part_number: form.part_number,
        category: form.category,
        quantity: quantity,
        reorder_level: reorderLevel,
        status: status
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        part_name: '',
        part_number: '',
        category: '',
        quantity: '',
        reorder_level: '',
        status: 'available'
      });

      onSuccess();
      alert('Stock item added successfully!');
    } catch (error) {
      console.error('Error adding stock:', error);
      setError('Error adding stock: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        part_name: '',
        part_number: '',
        category: '',
        quantity: '',
        reorder_level: '',
        status: 'available'
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Stock Item</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Part Name"
              value={form.part_name}
              onChange={(e) => setForm({ ...form, part_name: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Part Number / SKU"
              value={form.part_number}
              onChange={(e) => setForm({ ...form, part_number: e.target.value })}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="engine">Engine</MenuItem>
                <MenuItem value="tires">Tires</MenuItem>
                <MenuItem value="electrical">Electrical</MenuItem>
                <MenuItem value="brakes">Brakes</MenuItem>
                <MenuItem value="filters">Filters</MenuItem>
                <MenuItem value="fluids">Fluids</MenuItem>
                <MenuItem value="body">Body Parts</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reorder Level"
              type="number"
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
              disabled={loading}
              inputProps={{ min: 0 }}
              helperText="Minimum stock level before reordering is needed"
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
          {loading ? 'Adding...' : 'Add Stock Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
