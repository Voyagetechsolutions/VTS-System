import React from 'react';
import { Paper } from '@mui/material';
import { ResponsiveContainer, PieChart as RPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const COLORS = ['#1976d2', '#42a5f5', '#90caf9', '#64b5f6', '#1e88e5', '#1565c0'];

export default function PieChart({ data, nameKey = 'label', valueKey = 'value' }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <Paper sx={{ p: 2, mt: 2 }} className="fade-in">
      <ResponsiveContainer width="100%" height={280}>
        <RPieChart>
          <Pie data={rows} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={90} label>
            {rows.map((_, idx) => (
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RPieChart>
      </ResponsiveContainer>
    </Paper>
  );
}
