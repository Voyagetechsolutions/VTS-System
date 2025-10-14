import React, { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function SeatManagementTab() {
  const [tripId, setTripId] = useState('');
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const loadSeats = async () => {
      if (!tripId) return setSeats([]);
      const { data } = await supabase.from('trip_seats').select('seat_number, occupied, blocked, notes').eq('trip_id', tripId);
      setSeats(data || []);
    };
    loadSeats();
  }, [tripId]);

  const blockSeat = async (seat) => { 
    await supabase.from('trip_seats').update({ blocked: true }).eq('trip_id', tripId).eq('seat_number', seat); 
    const { data } = await supabase.from('trip_seats').select('seat_number, occupied, blocked, notes').eq('trip_id', tripId);
    setSeats(data || []);
  };
  const unblockSeat = async (seat) => { 
    await supabase.from('trip_seats').update({ blocked: false }).eq('trip_id', tripId).eq('seat_number', seat); 
    const { data } = await supabase.from('trip_seats').select('seat_number, occupied, blocked, notes').eq('trip_id', tripId);
    setSeats(data || []);
  };

  return (
    <Box>
      <DashboardCard title="Seat Management" variant="outlined" headerAction={<Box sx={{ display: 'flex', gap: 1 }}><TextField size="small" label="Trip ID" value={tripId} onChange={e => setTripId(e.target.value)} /><Button variant="contained" onClick={() => {}}>Load</Button></Box>}>
        <DataTable
          data={seats}
          columns={[
            { field: 'seat_number', headerName: 'Seat' },
            { field: 'occupied', headerName: 'Occupied' },
            { field: 'blocked', headerName: 'Blocked' },
            { field: 'notes', headerName: 'Notes' },
          ]}
          rowActions={[
            { label: 'Block', icon: 'block', onClick: (row) => blockSeat(row.seat_number) },
            { label: 'Unblock', icon: 'check', onClick: (row) => unblockSeat(row.seat_number) },
          ]}
          searchable
          pagination
        />
      </DashboardCard>
      {/* Note: Seat management is also accessible under Trip & Boarding Management */}
    </Box>
  );
}
