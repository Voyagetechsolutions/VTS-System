import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Divider, List, ListItem, ListItemText } from '@mui/material';
import { getDriverDocuments, uploadDriverDocument } from '../../supabase/api';
import { subscribeToDocuments } from '../../supabase/realtime';

export default function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);

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
    await uploadDriverDocument(file);
    setFile(null);
    load();
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Documents</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <Button variant="contained" onClick={onUpload} disabled={!file}>Upload</Button>
        </Stack>
        <Divider sx={{ my: 2 }} />
        <List dense>
          {(docs || []).map((d, idx) => (
            <ListItem key={d.id || idx}>
              <ListItemText primary={d.name || 'Document'} secondary={d.url || d.created_at} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}


