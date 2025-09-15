import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { getDriverProfile, uploadDriverDocument, getDriverDocuments } from '../../../supabase/api';

export default function ProfileTab() {
  const [profile, setProfile] = useState({});
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    getDriverProfile().then(({ data }) => setProfile(data || {}));
    getDriverDocuments().then(({ data }) => setDocs(data || []));
  }, []);

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDriverDocument(file);
    const res = await getDriverDocuments();
    setDocs(res.data || []);
  };

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>{(profile.name||'?').charAt(0)}</Avatar>
          <Box>
            <Typography variant="h6">{profile.name || '-'}</Typography>
            <Typography variant="body2" color="text.secondary">{profile.company || ''}</Typography>
            <Typography variant="body2">License: {profile.license_number || '-'}</Typography>
            <Typography variant="body2">Bus: {profile.assigned_bus || '-'}</Typography>
          </Box>
        </Stack>
      </Paper>

      <Box mt={3}>
        <Typography variant="subtitle1">Documents</Typography>
        <Button component="label" size="small" sx={{ mt: 1 }}>Upload Document<input hidden type="file" accept="image/*,application/pdf" onChange={onUpload} /></Button>
        <Stack spacing={1} sx={{ mt: 2 }}>
          {(docs||[]).map(d => {
            const exp = d.expires_at ? new Date(d.expires_at) : null;
            const soon = exp ? ((exp - new Date()) / (1000*60*60*24) <= 30) : false;
            return (
              <Paper key={d.id} sx={{ p: 1, borderLeft: soon ? '4px solid #ffa726' : '4px solid transparent' }}>
                <Typography>{d.name} • Expires: {d.expires_at || '—'} {soon ? '(Renew soon)' : ''}</Typography>
              </Paper>
            );
          })}
          {docs.length === 0 && <Typography variant="body2" color="text.secondary">No documents uploaded.</Typography>}
        </Stack>
      </Box>
    </Box>
  );
}


