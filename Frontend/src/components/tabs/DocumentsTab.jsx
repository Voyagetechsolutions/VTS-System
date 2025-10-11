import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Stack, Button, Divider, List, ListItem, ListItemText, Select, MenuItem, TextField, Link } from '@mui/material';
import { supabase } from '../../supabase/client';
import { subscribeToDocuments } from '../../supabase/realtime';

export default function DocumentsTab() {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('Company');
  const [name, setName] = useState('');

  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('company_id', window.companyId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;
      // attach signed URLs for quick view/download
      const withUrls = await Promise.all((data || []).map(async (d) => {
        try {
          const filePath = d.file_path || d.url; // tolerate both columns
          if (!filePath) return d;
          const { data: signed } = await supabase.storage
            .from('documents')
            .createSignedUrl(String(filePath), 3600);
          return { ...d, signed_url: signed?.signedUrl || null };
        } catch {
          return { ...d, signed_url: null };
        }
      }));
      setDocs(withUrls);
    } catch (e) {
      console.error('Load documents failed', e);
      setDocs([]);
    }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const sub = subscribeToDocuments(load);
    return () => { try { sub.unsubscribe?.(); } catch {} };
  }, []);

  const onUpload = async () => {
    if (!file) return;
    const path = `${window.userId || 'unknown'}/${Date.now()}_${file.name}`;
    try {
      // Upload to documents bucket with proper contentType
      const { data: up, error: upErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
      if (upErr) throw upErr;
      // Insert a row into documents table for tracking
      const row = {
        title: name || file.name,
        type: category,
        description: name || '',
        file_path: up?.path || path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        expiry_date: null,
        status: 'Active',
        user_id: window.userId || null,
        company_id: window.companyId,
        uploaded_at: new Date().toISOString(),
        uploaded_by: window.userId || null,
      };
      const { error: insErr } = await supabase.from('documents').insert([row]);
      if (insErr) throw insErr;
    } catch (e) {
      console.error('Upload failed', e);
    }
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
            <ListItem key={d.document_id || d.id || idx} secondaryAction={
              d.signed_url ? (
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="outlined" onClick={() => window.open(d.signed_url, '_blank')}>View</Button>
                  <Link href={d.signed_url} download target="_blank" rel="noopener">
                    <Button size="small" variant="contained">Download</Button>
                  </Link>
                </Stack>
              ) : null
            }>
              <ListItemText
                primary={`${(d.type || d.category || 'General')} · ${(d.title || d.name || d.file_name || 'Document')}`}
                secondary={d.expiry_date ? `Expires: ${new Date(d.expiry_date).toLocaleDateString()}` : (d.uploaded_at || d.created_at)}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}


