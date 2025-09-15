import React, { useEffect, useState } from 'react';
import { List, ListItem, ListItemText, Button } from '@mui/material';
import { getNotifications, markNotificationRead } from '../../../supabase/api';

export default function NotificationsTab() {
  const [notifications, setNotifications] = useState([]);
  useEffect(() => {
    getNotifications().then(({ data }) => setNotifications(data || []));
  }, []);
  return (
    <List>
      {notifications.map(n => (
        <ListItem key={n.notification_id} secondaryAction={
          <Button size="small" color="primary" onClick={() => markNotificationRead(n.notification_id)}>Mark Read</Button>
        }>
          <ListItemText primary={n.title} secondary={n.message} />
        </ListItem>
      ))}
    </List>
  );
}
