import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import jsPDF from 'jspdf';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import { getRevenueTrendByMonth, getBookingsTrendByMonth } from '../../supabase/api';
// ReportsTab: Revenue trends, bookings, export
export default function ReportsTab() {
  const [revenueData, setRevenueData] = useState([]);
  const [bookingData, setBookingData] = useState([]);

  useEffect(() => {
    getRevenueTrendByMonth().then(res => setRevenueData(res.data || []));
    getBookingsTrendByMonth().then(res => setBookingData(res.data || []));
  }, []);

  const exportCSV = () => {
    const rows = [
      ['Month', 'Revenue', 'Bookings', 'Cancellations'],
      ...mergeTrends(revenueData, bookingData).map(r => [r.month, r.revenue, r.bookings, r.cancellations])
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'reports.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Developer Reports', 20, 20);
    doc.setFontSize(10);
    mergeTrends(revenueData, bookingData).forEach((r, idx) => {
      doc.text(`${r.month}: Revenue ${r.revenue} | Bookings ${r.bookings} | Cxl ${r.cancellations}`, 20, 36 + idx * 6);
    });
    doc.save('reports.pdf');
  };

  const mergeTrends = (rev, book) => {
    const map = new Map();
    rev.forEach(r => map.set(r.month, { month: r.month, revenue: r.revenue, bookings: 0, cancellations: 0 }));
    book.forEach(b => {
      const cur = map.get(b.month) || { month: b.month, revenue: 0, bookings: 0, cancellations: 0 };
      cur.bookings = b.bookings;
      cur.cancellations = b.cancellations;
      map.set(b.month, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  };
  return (
    <Box>
      <Typography variant="h5">Revenue Trends</Typography>
      <BarChart data={revenueData} />
      <Typography variant="h6" sx={{ mt: 3 }}>Bookings vs Cancellations</Typography>
      <LineChart data={bookingData} />
      <Box mt={2}>
        <Button variant="contained" onClick={exportCSV}>Export CSV</Button>
        <Button variant="outlined" sx={{ ml: 2 }} onClick={exportPDF}>Export PDF</Button>
      </Box>
    </Box>
  );
}
