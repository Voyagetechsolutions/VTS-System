import React, { useEffect, useState } from 'react';
import { Box, Button, Stack } from '@mui/material';
import { getRouteCoordinates, postGPSLocation } from '../../../supabase/api';

export default function MapTab() {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    const init = async () => {
      const route_id = window.currentRouteId || null;
      if (route_id) {
        const rc = await getRouteCoordinates(route_id);
        setCoords(rc.data || null);
      }
    };
    init();
  }, []);
  const openMaps = () => {
    if (coords?.originCoords && coords?.destinationCoords) {
      window.open(`https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${coords.originCoords.lat},${coords.originCoords.lng}&destination=${coords.destinationCoords.lat},${coords.destinationCoords.lng}`, '_blank');
    }
  };
  return (
    <Box>
      <Stack direction="row" spacing={1}>
        <Button onClick={openMaps}>Open Google Maps</Button>
        <Button onClick={() => { if (navigator.geolocation) navigator.geolocation.getCurrentPosition(p => postGPSLocation(p.coords.latitude, p.coords.longitude)); }}>Post Location</Button>
      </Stack>
    </Box>
  );
}


