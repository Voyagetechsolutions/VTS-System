import React, { useEffect, useState, useCallback } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, List, ListItem, Checkbox, ListItemText } from '@mui/material';
import { getCompanyUsers } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';

export default function DailyTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');

  const load = useCallback(async () => {
    const r = await supabase.from('daily_tasks').select('id, task, assigned_to, status, created_at').eq('company_id', window.companyId).order('created_at', { ascending: false });
    setTasks(r.data || []);
  }, []);

  useEffect(() => { 
    const loadData = async () => {
      await load();
    };
    loadData();
  }, [load]);

  const add = async () => {
    if (!task.trim()) return;
    try { 
      await supabase.from('daily_tasks').insert([{ company_id: window.companyId, task, assigned_to: 'unassigned', status: 'pending' }]); 
      setTask(''); 
      load(); 
    } catch (error) { 
      console.error('Failed to add task:', error); 
    }
  };

  const complete = async (id) => { 
    try { 
      await supabase.from('daily_tasks').update({ status: 'completed' }).eq('id', id); 
      load(); 
    } catch (error) { 
      console.error('Failed to complete task:', error); 
    } 
  };

  const remove = async (id) => { 
    try { 
      await supabase.from('daily_tasks').delete().eq('id', id); 
      load(); 
    } catch (error) { 
      console.error('Failed to remove task:', error); 
    } 
  };

  const toggle = async (task) => {
    try {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await supabase.from('daily_tasks').update({ status: newStatus }).eq('id', task.id);
      load();
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Daily Task Checklist</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth label="Task" value={task} onChange={e => setTask(e.target.value)} />
          <Button variant="contained" onClick={add}>Add</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List>
          {(tasks || []).map(t => {
            let text = t.message; let done = false; try { const m = JSON.parse(t.message || '{}'); text = m.text || t.message; done = !!m.done; } catch {}
            return (
              <ListItem key={t.id} secondaryAction={<Checkbox checked={done} onChange={() => toggle(t)} />}>
                <ListItemText primary={text} secondary={new Date(t.created_at).toLocaleString()} />
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
}


