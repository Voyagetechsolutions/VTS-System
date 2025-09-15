import React from 'react';
import { Paper } from '@mui/material';
import { ResponsiveContainer, BarChart as RBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function BarChart({ data, xKey = 'month', yKey = 'revenue' }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Paper sx={{ p: 2, mt: 2 }} className="fade-in">
      <ResponsiveContainer width="100%" height={280}>
        <RBarChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={yKey} fill="#1976d2" radius={[4,4,0,0]} />
        </RBarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
