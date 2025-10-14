import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function EditPayrollModal({ open, onClose, onSuccess, payrollRecord }) {
  const [form, setForm] = useState({
    employee_name: '',
    department: '',
    role: '',
    month: '',
    salary: '',
    bonus: '0',
    deductions: '0',
    net_pay: '0',
    status: 'pending',
    payment_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payrollRecord && open) {
      setForm({
        employee_name: payrollRecord.employee_name || '',
        department: payrollRecord.department || '',
        role: payrollRecord.role || '',
        month: payrollRecord.month || '',
        salary: payrollRecord.salary?.toString() || '',
        bonus: payrollRecord.bonus?.toString() || '0',
        deductions: payrollRecord.deductions?.toString() || '0',
        net_pay: payrollRecord.net_pay?.toString() || '0',
        status: payrollRecord.status || 'pending',
        payment_date: payrollRecord.payment_date || ''
      });
    }
  }, [payrollRecord, open]);

  // Calculate net pay when salary, bonus, or deductions change
  useEffect(() => {
    const salary = parseFloat(form.salary) || 0;
    const bonus = parseFloat(form.bonus) || 0;
    const deductions = parseFloat(form.deductions) || 0;
    const netPay = salary + bonus - deductions;
    
    setForm(prev => ({ ...prev, net_pay: netPay.toString() }));
  }, [form.salary, form.bonus, form.deductions]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.month || !form.salary) {
        setError('Please fill in all required fields');
        return;
      }

      const { error: updateError } = await supabase
        .from('payroll_records')
        .update({
          month: form.month,
          salary: parseFloat(form.salary),
          bonus: parseFloat(form.bonus) || 0,
          deductions: parseFloat(form.deductions) || 0,
          net_pay: parseFloat(form.net_pay),
          status: form.status,
          payment_date: form.payment_date || null
        })
        .eq('id', payrollRecord.id);

      if (updateError) throw updateError;

      onSuccess();
      alert('Payroll record updated successfully!');
    } catch (error) {
      console.error('Error updating payroll record:', error);
      setError('Error updating payroll record: ' + error.message);
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

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Payroll Record</DialogTitle>
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
              label="Employee Name"
              value={form.employee_name}
              disabled
              helperText="Cannot be changed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={form.department}
              disabled
              helperText="Cannot be changed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              value={form.role}
              disabled
              helperText="Cannot be changed"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Month"
              type="month"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Salary"
              type="number"
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              required
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Bonus"
              type="number"
              value={form.bonus}
              onChange={(e) => setForm({ ...form, bonus: e.target.value })}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Deductions"
              type="number"
              value={form.deductions}
              onChange={(e) => setForm({ ...form, deductions: e.target.value })}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Net Pay"
              type="number"
              value={form.net_pay}
              disabled
              helperText="Calculated as Salary + Bonus - Deductions"
              inputProps={{ step: 0.01 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Payment Date"
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              disabled={loading}
              helperText="Optional - leave empty if not yet paid"
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
          {loading ? 'Updating...' : 'Update Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
