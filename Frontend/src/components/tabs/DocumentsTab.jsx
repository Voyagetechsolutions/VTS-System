import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Divider, List, ListItem, ListItemText, Select, MenuItem, TextField } from '@mui/material';
import { supabase } from '../../supabase/client';
import { getDriverDocuments, uploadDriverDocument } from '../../supabase/api';
import { subscribeToDocuments } from '../../supabase/realtime';

export default function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Company');
  const [name, setName] = useState('');

  const load = async () => {
    const r = await getDriverDocuments();
    setDocs(r.data || []);
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sub = subscribeToDocuments(load);
    return () => { try { sub.unsubscribe?.(); } catch {} };
  }, []);

  const onUpload = async () => {
    if (!file) return;
    // store file and metadata
    const path = `docs/${category}/${Date.now()}_${file.name}`;
    try {
      const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (!error) {
        await uploadDriverDocument(file); // backward compatibility if used elsewhere
        await supabase.from('documents').insert([{ company_id: window.companyId, category, name: name || file.name, url: data?.path || path, expires_at: null }]);
      }
    } catch {}
    setFile(null);
    setName('');
    load();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Select size="small" value={category} onChange={e=>setCategory(e.target.value)}>
            <MenuItem value="Company">Company</MenuItem>
            <MenuItem value="Vehicle">Vehicle</MenuItem>
            <MenuItem value="Driver">Driver</MenuItem>
            <MenuItem value="Trip">Trip</MenuItem>
          </Select>
          <TextField size="small" label="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button variant="contained" onClick={onUpload} disabled={!file}>Upload</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {(docs || []).map((d, idx) => (
            <ListItem key={d.id || idx}>
              <ListItemText primary={`${d.category || 'General'} · ${d.name || 'Document'}`} secondary={d.expires_at ? `Expires: ${new Date(d.expires_at).toLocaleDateString()}` : (d.url || d.created_at)} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}


