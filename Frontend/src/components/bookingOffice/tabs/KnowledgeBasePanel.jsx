import React, { useEffect, useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';
import { supabase } from '../../../supabase/client';

export default function KnowledgeBasePanel() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.from('knowledge_base').select('id, title, content').order('created_at', { ascending: false }).limit(20);
        if (!error && data) { setItems(data); return; }
      } catch (error) { console.warn('Knowledge base error:', error); }
      setItems([
        { id: 'kb1', title: 'How to issue a new ticket', content: 'Go to Bookings Hub and use Quick Booking.' },
        { id: 'kb2', title: 'Refund policy', content: 'Refund within 24 hours of departure are subject to approval.' },
        { id: 'kb3', title: 'Boarding checklist', content: 'Verify passenger ID, scan QR, confirm seat.' },
      ]);
    })();
  }, []);
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Knowledge Base</Typography>
      <List dense>
        {items.map(i => (
          <ListItem key={i.id} alignItems="flex-start">
            <ListItemText primary={i.title} secondary={i.content} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
