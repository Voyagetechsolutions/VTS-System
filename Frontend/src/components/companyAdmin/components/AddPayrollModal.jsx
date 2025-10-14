import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function AddPayrollModal({ open, onClose, onSuccess, staff }) {
  const [form, setForm] = useState({
    employee_id: '',
    employee_name: '',
    department: '',
    role: '',
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    salary: '',
    bonus: '0',
    deductions: '0',
    net_pay: '0',
    status: 'pending',
    payment_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');

  // Calculate net pay when salary, bonus, or deductions change
  useEffect(() => {
    const salary = parseFloat(form.salary) || 0;
    const bonus = parseFloat(form.bonus) || 0;
    const deductions = parseFloat(form.deductions) || 0;
    const netPay = salary + bonus - deductions;
    
    setForm(prev => ({ ...prev, net_pay: netPay.toString() }));
  }, [form.salary, form.bonus, form.deductions]);

  const handleEmployeeChange = (employeeId) => {
    const selectedEmployee = staff.find(emp => emp.id === employeeId);
    if (selectedEmployee) {
      setForm(prev => ({
        ...prev,
        employee_id: employeeId,
        employee_name: selectedEmployee.name,
        department: selectedEmployee.department,
        role: selectedEmployee.role
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!form.employee_id || !form.month || !form.salary) {
        setError('Please fill in all required fields');
        return;
      }

      // Check if payroll record already exists for this employee and month
      const { data: existingRecord } = await supabase
        .from('payroll_records')
        .select('id')
        .eq('company_id', companyId)
        .eq('employee_id', form.employee_id)
        .eq('month', form.month)
        .single();

      if (existingRecord) {
        setError('Payroll record already exists for this employee and month');
        return;
      }

      const { error: insertError } = await supabase.from('payroll_records').insert([{
        company_id: companyId,
        employee_id: form.employee_id,
        employee_name: form.employee_name,
        department: form.department,
        role: form.role,
        month: form.month,
        salary: parseFloat(form.salary),
        bonus: parseFloat(form.bonus) || 0,
        deductions: parseFloat(form.deductions) || 0,
        net_pay: parseFloat(form.net_pay),
        status: form.status,
        payment_date: form.payment_date || null
      }]);

      if (insertError) throw insertError;

      // Reset form
      setForm({
        employee_id: '',
        employee_name: '',
        department: '',
        role: '',
        month: new Date().toISOString().slice(0, 7),
        salary: '',
        bonus: '0',
        deductions: '0',
        net_pay: '0',
        status: 'pending',
        payment_date: ''
      });

      onSuccess();
      alert('Payroll record added successfully!');
    } catch (error) {
      console.error('Error adding payroll record:', error);
      setError('Error adding payroll record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        employee_id: '',
        employee_name: '',
        department: '',
        role: '',
        month: new Date().toISOString().slice(0, 7),
        salary: '',
        bonus: '0',
        deductions: '0',
        net_pay: '0',
        status: 'pending',
        payment_date: ''
      });
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Payroll Record</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel>Employee</InputLabel>
              <Select
                value={form.employee_id}
                label="Employee"
                onChange={(e) => handleEmployeeChange(e.target.value)}
                disabled={loading}
              >
                {staff.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.department} ({employee.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Department"
              value={form.department}
              disabled
              helperText="Auto-filled based on employee"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Role"
              value={form.role}
              disabled
              helperText="Auto-filled based on employee"
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
          {loading ? 'Adding...' : 'Add Payroll Record'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
