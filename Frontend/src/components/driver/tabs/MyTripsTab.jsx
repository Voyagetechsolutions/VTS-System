import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Box, Typography } from '@mui/material';
import { getDriverTrips, getDriverTripDetails, updateTripStatus } from '../../../supabase/api';

export default function MyTripsTab() {
  const [trips, setTrips] = useState([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => getDriverTrips().then(({ data }) => setTrips(data || []));
  useEffect(() => { load(); }, []);

  const openDetails = async (trip) => {
    const res = await getDriverTripDetails(trip.trip_id);
    setSelected(res.data || { ...trip, passengers: [] });
    setOpen(true);
  };

  const updateStatus = async (status) => {
    if (!selected) return;
    await updateTripStatus(selected.trip_id, status);
    setOpen(false);
    setSelected(null);
    load();
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Route</TableCell>
            <TableCell>Departure</TableCell>
            <TableCell>Bus</TableCell>
            <TableCell>Seats</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(trips || []).map(t => (
            <TableRow key={t.trip_id} hover>
              <TableCell>{t.origin} → {t.destination}</TableCell>
              <TableCell>{t.departure_time}</TableCell>
              <TableCell>{t.license_plate || t.bus_number || '-'}</TableCell>
              <TableCell>{t.seat_count || t.capacity || '-'}</TableCell>
              <TableCell><Chip label={t.status || 'Scheduled'} size="small" /></TableCell>
              <TableCell>
                <Button size="small" onClick={() => openDetails(t)}>Details</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Trip Details</DialogTitle>
        <DialogContent>
          {selected && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>{selected.origin} → {selected.destination}</Typography>
              <Typography variant="body2" gutterBottom>ETA: {selected.departure_time} → {selected.arrival_time}</Typography>
              <Typography variant="subtitle2" sx={{ mt: 2 }}>Passenger Manifest</Typography>
              <Table size="small" sx={{ mt: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Seat</TableCell>
                    <TableCell>Emergency Contact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(selected.passengers || []).map(p => (
                    <TableRow key={p.booking_id}>
                      <TableCell>{p.passenger_name}</TableCell>
                      <TableCell>{p.seat_number}</TableCell>
                      <TableCell>{p.emergency_contact || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selected.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{selected.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={() => updateStatus('Departed')} variant="contained">Departed</Button>
          <Button onClick={() => updateStatus('On the Way')} variant="contained" color="warning">On the Way</Button>
          <Button onClick={() => updateStatus('Arrived')} variant="contained" color="success">Arrived</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


