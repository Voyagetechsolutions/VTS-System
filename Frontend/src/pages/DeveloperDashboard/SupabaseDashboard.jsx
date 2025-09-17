import React from 'react';
import { Box } from '@mui/material';
import CompaniesTable from '../../components/supabase/CompaniesTable';
import RealtimeTrips from '../../components/supabase/RealtimeTrips';
// ...import other supabase components as needed

const tabList = [
  'Overview', 'Companies', 'Realtime Trips'
  // Add other tabs as needed
];

const tabComponents = [
  <Box>Overview content here</Box>,
  <CompaniesTable />,
  <RealtimeTrips />
  // Add other tab components as needed
];

export default function SupabaseDashboard() {
  const [tab, setTab] = React.useState(0);
  return (
    <Box sx={{ width: '100%' }}>
      <Box mt={2}>{tabComponents[tab]}</Box>
    </Box>
  );
}
