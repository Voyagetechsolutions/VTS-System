import { useState, useMemo } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Chip, TextField, InputAdornment
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

export default function ReportsTable({ selectedChart, reportData, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');

  const tableData = useMemo(() => {
    if (!selectedChart || !reportData) return [];

    let data = [];
    let columns = [];

    switch (selectedChart.type) {
      case 'bookings':
        data = reportData.bookings;
        columns = [
          { key: 'passenger_name', label: 'Passenger Name' },
          { key: 'branch', label: 'Branch', render: (item) => item.branch?.name || 'Unknown' },
          { key: 'route', label: 'Route', render: (item) => 
            item.trip?.route ? `${item.trip.route.pick_up} → ${item.trip.route.drop_off}` : 'Unknown Route'
          },
          { key: 'status', label: 'Status', render: (item) => (
            <Chip 
              label={item.status} 
              color={item.status === 'Confirmed' ? 'success' : item.status === 'Pending' ? 'warning' : 'error'}
              size="small"
            />
          )},
          { key: 'booking_datetime', label: 'Booking Date', render: (item) => 
            new Date(item.booking_datetime).toLocaleDateString()
          }
        ];
        break;

      case 'revenue':
        data = reportData.revenue.filter(booking => booking.status === 'Confirmed');
        columns = [
          { key: 'passenger_name', label: 'Passenger Name' },
          { key: 'route', label: 'Route', render: (item) => 
            item.trip?.route ? `${item.trip.route.pick_up} → ${item.trip.route.drop_off}` : 'Unknown Route'
          },
          { key: 'revenue', label: 'Revenue', render: () => '$25.00' }, // Mock revenue
          { key: 'booking_datetime', label: 'Date', render: (item) => 
            new Date(item.booking_datetime).toLocaleDateString()
          }
        ];
        break;

      case 'trips':
        data = reportData.trips;
        columns = [
          { key: 'id', label: 'Trip ID', render: (item) => item.id.slice(0, 8) + '...' },
          { key: 'route', label: 'Route', render: (item) => 
            item.route ? `${item.route.pick_up} → ${item.route.drop_off}` : 'Unknown Route'
          },
          { key: 'bus', label: 'Bus', render: (item) => item.bus?.name || 'Unknown Bus' },
          { key: 'departure', label: 'Departure', render: (item) => 
            new Date(item.departure).toLocaleString()
          },
          { key: 'status', label: 'Status', render: (item) => (
            <Chip 
              label={item.status} 
              color={item.status === 'Completed' ? 'success' : item.status === 'Scheduled' ? 'info' : 'error'}
              size="small"
            />
          )}
        ];
        break;

      case 'passengers':
        data = reportData.passengers.filter(booking => booking.status === 'Confirmed');
        columns = [
          { key: 'passenger_name', label: 'Passenger Name' },
          { key: 'route', label: 'Route', render: (item) => 
            item.trip?.route ? `${item.trip.route.pick_up} → ${item.trip.route.drop_off}` : 'Unknown Route'
          },
          { key: 'booking_datetime', label: 'Travel Date', render: (item) => 
            new Date(item.booking_datetime).toLocaleDateString()
          },
          { key: 'branch', label: 'Branch', render: (item) => item.branch?.name || 'Unknown' }
        ];
        break;

      case 'expenses':
        data = reportData.expenses;
        columns = [
          { key: 'type', label: 'Type', render: (item) => 
            item.type ? `Maintenance (${item.type})` : 'Fuel'
          },
          { key: 'cost', label: 'Cost', render: (item) => 
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.cost)
          },
          { key: 'date', label: 'Date', render: (item) => 
            new Date(item.date).toLocaleDateString()
          },
          { key: 'bus_name', label: 'Bus', render: (item) => item.bus_name || 'N/A' }
        ];
        break;

      default:
        return [];
    }

    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => {
        return columns.some(col => {
          const value = col.render ? 
            (typeof col.render(item) === 'string' ? col.render(item) : '') :
            (item[col.key] || '');
          return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    return { data, columns };
  }, [selectedChart, reportData, searchTerm]);

  const paginatedData = tableData.data?.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  ) || [];

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading data...</Typography>
      </Box>
    );
  }

  if (!selectedChart) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Select a chart segment to view detailed data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Click on any chart in the Analytics tab to drill down into the underlying data
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          {selectedChart.type.charAt(0).toUpperCase() + selectedChart.type.slice(1)} Details
        </Typography>
        <TextField
          size="small"
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 250 }}
        />
      </Box>

      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              {tableData.columns?.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={index} hover>
                {tableData.columns?.map((column) => (
                  <TableCell key={column.key}>
                    {column.render ? column.render(item) : item[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {tableData.data?.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No data available for the selected filter
            </Typography>
          </Box>
        )}

        <TablePagination
          component="div"
          count={tableData.data?.length || 0}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Box>
    </Box>
  );
}
