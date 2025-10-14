import { useState, useMemo } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton, Avatar
} from '@mui/material';
import {
  Assignment as AssignIcon, Visibility as ViewIcon, Phone as PhoneIcon
} from '@mui/icons-material';

export default function StaffCoordinationTable({ staff, loading, filters }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'On Break': return 'warning';
      case 'Off Duty': return 'default';
      case 'Inactive': return 'error';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Driver': return '🚗';
      case 'Mechanic': return '🔧';
      case 'Supervisor': return '👔';
      case 'Dispatcher': return '📻';
      default: return '👤';
    }
  };

  const filteredStaff = useMemo(() => {
    return staff.filter(member => {
      const matchesSearch = !filters.search || 
        member.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.role.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesRole = !filters.role || member.role === filters.role;
      const matchesStatus = !filters.status || member.status === filters.status;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, filters]);

  const paginatedStaff = filteredStaff.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Staff Coordination</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading staff data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Staff Coordination</Typography>
        
        {filteredStaff.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {staff.length === 0 ? 'No staff data available' : 'No staff match your filters'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedStaff.map((member) => (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                            {member.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {member.name}
                            </Typography>
                            {member.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {member.phone}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.1em' }}>
                            {getRoleIcon(member.role)}
                          </Typography>
                          <Typography variant="body2">
                            {member.role}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={member.status} 
                          color={getStatusColor(member.status)}
                          size="small"
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          title="Assign Task"
                          color="primary"
                        >
                          <AssignIcon />
                        </IconButton>
                        {member.phone && (
                          <IconButton
                            size="small"
                            title="Call"
                            color="success"
                            onClick={() => window.open(`tel:${member.phone}`)}
                          >
                            <PhoneIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          title="View Profile"
                          color="info"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={filteredStaff.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>

            {/* Staff Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Staff: {filteredStaff.length} | 
                Active: {filteredStaff.filter(s => s.status === 'Active').length} | 
                Drivers: {filteredStaff.filter(s => s.role === 'Driver').length} | 
                Mechanics: {filteredStaff.filter(s => s.role === 'Mechanic').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
