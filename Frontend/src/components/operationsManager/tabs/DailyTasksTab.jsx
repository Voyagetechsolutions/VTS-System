import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, TextField, Button, Divider, List, ListItem, Checkbox, ListItemText } from '@mui/material';
import { getActivityLog } from '../../../supabase/api';
import { supabase } from '../../../supabase/client';

export default function DailyTasksTab() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');

  const load = async () => {
    const r = await getActivityLog({ types: ['task'] });
    setTasks(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!task.trim()) return;
    const payload = { company_id: window.companyId, type: 'task', message: JSON.stringify({ text: task, done: false }) };
    await supabase.from('activity_log').insert([payload]);
    setTask('');
    load();
  };

  const toggle = async (row) => {
    let msg = {}; try { msg = JSON.parse(row.message || '{}'); } catch {}
    msg.done = !msg.done;
    await supabase.from('activity_log').update({ message: JSON.stringify(msg) }).eq('id', row.id);
    load();
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


