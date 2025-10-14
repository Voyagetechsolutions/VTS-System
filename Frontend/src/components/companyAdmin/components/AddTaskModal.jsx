import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Grid, Alert, Box, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';

export default function AddTaskModal({ open, staff, onClose, onComplete }) {
  const [form, setForm] = useState({
    taskName: '',
    assignedTo: '',
    priority: 'Medium',
    dueDate: '',
    description: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.taskName.trim()) {
      setError('Task name is required');
      return;
    }

    if (!form.assignedTo) {
      setError('Please assign the task to a staff member');
      return;
    }

    if (!form.dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      // Mock task creation - in real app, this would save to Supabase
      const newTask = {
        id: `task_${Date.now()}`,
        task_name: form.taskName.trim(),
        assigned_to: staff.find(s => s.id === form.assignedTo),
        priority: form.priority,
        due_date: form.dueDate,
        description: form.description.trim(),
        status: 'Pending',
        created_at: new Date().toISOString()
      };

      console.log('Creating new task:', newTask);

      // Reset form
      setForm({
        taskName: '',
        assignedTo: '',
        priority: 'Medium',
        dueDate: '',
        description: ''
      });

      onComplete();
    } catch (error) {
      console.error('Error creating task:', error);
      setError(error.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setForm({
        taskName: '',
        assignedTo: '',
        priority: 'Medium',
        dueDate: '',
        description: ''
      });
      setError('');
      onClose();
    }
  };

  // Get tomorrow's date as default minimum
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add New Task</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Name"
                  value={form.taskName}
                  onChange={(e) => handleChange('taskName', e.target.value)}
                  required
                  disabled={saving}
                  placeholder="Enter task name"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Assign To</InputLabel>
                  <Select
                    value={form.assignedTo}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                    label="Assign To"
                    disabled={saving}
                  >
                    {staff.map((member) => (
                      <MenuItem key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={form.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    label="Priority"
                    disabled={saving}
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Due Date"
                  value={form.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  required
                  disabled={saving}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: getTomorrowDate() }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={saving}
                  placeholder="Enter task description (optional)"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
