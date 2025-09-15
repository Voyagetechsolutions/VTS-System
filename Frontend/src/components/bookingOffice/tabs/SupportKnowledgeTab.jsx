import React from 'react';
import { Grid } from '@mui/material';
import SupportTab from './SupportTab';
import KnowledgeBasePanel from './KnowledgeBasePanel';

export default function SupportKnowledgeTab() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <SupportTab />
      </Grid>
      <Grid item xs={12} md={6}>
        <KnowledgeBasePanel />
      </Grid>
    </Grid>
  );
}
