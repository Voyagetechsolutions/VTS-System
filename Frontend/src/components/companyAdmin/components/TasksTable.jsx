import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Typography, Box, Card, CardContent, Chip, IconButton
} from '@mui/material';
import {
  Edit as EditIcon, CheckCircle as CompleteIcon, Delete as DeleteIcon
} from '@mui/icons-material';

export default function TasksTable({ tasks, loading }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'success';
      case 'In Progress': return 'info';
      case 'Pending': return 'warning';
      case 'Overdue': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return '✅';
      case 'In Progress': return '🔄';
      case 'Pending': return '⏳';
      case 'Overdue': return '⚠️';
      default: return '📋';
    }
  };

  const getPriorityColor = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'error'; // Overdue
    if (diffDays <= 1) return 'warning'; // Due soon
    return 'default'; // Normal
  };

  const handleCompleteTask = (task) => {
    // Mock complete task
    alert(`Task "${task.task_name}" marked as completed`);
  };

  const handleEditTask = (task) => {
    // Mock edit task
    alert(`Editing task: ${task.task_name}`);
  };

  const handleDeleteTask = (task) => {
    // Mock delete task
    if (window.confirm(`Are you sure you want to delete task "${task.task_name}"?`)) {
      alert(`Task "${task.task_name}" deleted`);
    }
  };

  const paginatedTasks = tasks.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Task Management</Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading tasks data...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>Task Management</Typography>
        
        {tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No tasks assigned
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ width: '100%', overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task Name</TableCell>
                    <TableCell>Assigned Staff</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Due Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {task.task_name}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {task.assigned_to?.name || 'Unassigned'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {task.assigned_to?.role || ''}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '1.2em' }}>
                            {getStatusIcon(task.status)}
                          </Typography>
                          <Chip 
                            label={task.status} 
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip 
                          label={formatDate(task.due_date)} 
                          color={getPriorityColor(task.due_date)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                        {task.status !== 'Completed' && (
                          <IconButton
                            size="small"
                            onClick={() => handleCompleteTask(task)}
                            title="Mark as Complete"
                            color="success"
                          >
                            <CompleteIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEditTask(task)}
                          title="Edit Task"
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTask(task)}
                          title="Delete Task"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <TablePagination
                component="div"
                count={tasks.length}
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

            {/* Tasks Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Tasks: {tasks.length} | 
                Completed: {tasks.filter(t => t.status === 'Completed').length} | 
                In Progress: {tasks.filter(t => t.status === 'In Progress').length} | 
                Pending: {tasks.filter(t => t.status === 'Pending').length}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
