import React from 'react';
import { Paper } from '@mui/material';
import { ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function LineChart({ data, xKey = 'month', yKey = 'bookings' }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Paper sx={{ p: 2, mt: 2 }} className="fade-in">
      <ResponsiveContainer width="100%" height={280}>
        <RLineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={yKey} stroke="#1976d2" strokeWidth={2} dot={false} />
        </RLineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
