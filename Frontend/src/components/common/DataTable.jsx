import React, { useEffect, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Typography,
  alpha,
  Skeleton,
  TableSortLabel,
  Button,
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Icon } from './IconMap';
import { SearchField } from './FormComponents';
import DashboardCard from './DashboardCard';
import theme from '../../styles/theme';

const DataTable = ({
  title,
  subtitle,
  data = [],
  columns = [],
  loading = false,
  selectable = false,
  sortable = true,
  searchable = true,
  pagination = true,
  actions = [],
  rowActions = [],
  emptyMessage = 'No data available',
  searchPlaceholder = 'Search...',
  className,
  virtualize = false,
  virtualRowHeight = 48,
  ...props
}) => {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    if (!virtualize) return undefined;
    const el = containerRef.current;
    if (!el) return undefined;
    const onScroll = () => setScrollTop(el.scrollTop || 0);
    const onResize = () => setViewportHeight(el.clientHeight || 0);
    onResize();
    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    return () => {
      try { el.removeEventListener('scroll', onScroll); } catch {}
      try { window.removeEventListener('resize', onResize); } catch {}
    };
  }, [virtualize]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuRow, setActionMenuRow] = useState(null);

  // Filter data based on search term
  const filteredData = searchable && searchTerm
    ? data.filter((row) =>
        columns.some((column) => {
          const value = row[column.field];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      )
    : data;

  // Sort data
  const sortedData = sortable && sortConfig.key
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginate data
  const paginatedData = pagination
    ? sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : sortedData;

  // Virtualization window (only when pagination=false and virtualize=true)
  const effectiveData = (!pagination && virtualize) ? (() => {
    const vh = viewportHeight || 400;
    const rowsInView = Math.max(1, Math.ceil(vh / virtualRowHeight) + 5);
    const startIndex = Math.max(0, Math.floor(scrollTop / virtualRowHeight));
    const endIndex = Math.min(paginatedData.length, startIndex + rowsInView);
    return { startIndex, endIndex, rows: paginatedData.slice(startIndex, endIndex) };
  })() : { startIndex: 0, endIndex: paginatedData.length, rows: paginatedData };

  // Handle selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(paginatedData.map((row, index) => index));
    } else {
      setSelected([]);
    }
  };

  const handleRowSelect = (index) => {
    const selectedIndex = selected.indexOf(index);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, index);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (!sortable) return;
    
    const isAsc = sortConfig.key === field && sortConfig.direction === 'asc';
    setSortConfig({
      key: field,
      direction: isAsc ? 'desc' : 'asc',
    });
  };

  // Handle row actions
  const handleActionMenuOpen = (event, row, index) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuRow({ ...row, index });
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuRow(null);
  };

  const handleActionClick = (action) => {
    if (action.onClick) {
      action.onClick(actionMenuRow);
    }
    handleActionMenuClose();
  };

  // Render cell content
  const renderCellContent = (row, column) => {
    const value = row[column.field];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.type === 'status') {
      const statusColors = {
        active: 'success',
        inactive: 'error',
        pending: 'warning',
        completed: 'success',
        cancelled: 'error',
      };
      
      return (
        <Chip
          label={value}
          size="small"
          color={statusColors[value?.toLowerCase()] || 'default'}
          sx={{
            fontWeight: theme.typography.fontWeight.medium,
            fontSize: '12px',
          }}
        />
      );
    }
    
    if (column.type === 'boolean') {
      return (
        <Icon 
          name={value ? 'success' : 'error'} 
          size={16} 
          color={value ? theme.colors.success : theme.colors.error}
        />
      );
    }
    
    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    }
    
    if (column.type === 'date') {
      return value ? new Date(value).toLocaleDateString() : '-';
    }
    
    return value || '-';
  };

  const tableContent = (
    <>
      {/* Search and Actions Bar */}
      {(searchable || actions.length > 0) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
            flexWrap: 'wrap',
          }}
        >
          {searchable && (
            <SearchField
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              sx={{ maxWidth: 300 }}
            />
          )}
          
          {actions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outlined'}
                  size="small"
                  startIcon={action.icon && <Icon name={action.icon} size={16} />}
                  onClick={() => action.onClick(selected)}
                  disabled={action.requiresSelection && selected.length === 0}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Table */}
      <TableContainer
        ref={containerRef}
        sx={{
          borderRadius: theme.borderRadius.lg,
          border: `1px solid ${theme.colors.border.light}`,
          overflow: 'hidden',
          maxHeight: virtualize ? 520 : 'unset',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: alpha(theme.colors.primary[50], 0.5),
              }}
            >
              {selectable && (
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selected.length > 0 && selected.length < paginatedData.length
                    }
                    checked={
                      paginatedData.length > 0 && selected.length === paginatedData.length
                    }
                    onChange={handleSelectAllClick}
                    sx={{
                      color: theme.colors.text.secondary,
                      '&.Mui-checked': {
                        color: theme.colors.primary[600],
                      },
                    }}
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  align={column.align || 'left'}
                  sx={{
                    fontWeight: theme.typography.fontWeight.semibold,
                    color: theme.colors.text.primary,
                    borderBottom: `2px solid ${theme.colors.border.medium}`,
                  }}
                >
                  {sortable && column.sortable !== false ? (
                    <TableSortLabel
                      active={sortConfig.key === column.field}
                      direction={
                        sortConfig.key === column.field ? sortConfig.direction : 'asc'
                      }
                      onClick={() => handleSort(column.field)}
                      sx={{
                        '&.MuiTableSortLabel-root': {
                          color: theme.colors.text.primary,
                        },
                        '&.MuiTableSortLabel-root:hover': {
                          color: theme.colors.primary[600],
                        },
                        '&.Mui-active': {
                          color: theme.colors.primary[600],
                        },
                      }}
                    >
                      {column.headerName}
                    </TableSortLabel>
                  ) : (
                    column.headerName
                  )}
                </TableCell>
              ))}
              
              {rowActions.length > 0 && (
                <TableCell align="right" sx={{ width: 60 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from({ length: rowsPerPage }).map((_, index) => (
                <TableRow key={index}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={18} height={18} />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.field}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                  {rowActions.length > 0 && (
                    <TableCell>
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty state
              <TableRow>
                <TableCell
                  colSpan={
                    columns.length + 
                    (selectable ? 1 : 0) + 
                    (rowActions.length > 0 ? 1 : 0)
                  }
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: theme.colors.text.muted }}
                  >
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Data rows (virtualized slice when enabled)
              effectiveData.rows.map((row, indexRel) => {
                const index = effectiveData.startIndex + indexRel;
                return (
                <TableRow
                  key={index}
                  selected={selected.includes(index)}
                  hover
                  sx={{
                    cursor: selectable ? 'pointer' : 'default',
                    '&:hover': {
                      backgroundColor: alpha(theme.colors.primary[50], 0.3),
                    },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.colors.primary[100], 0.4),
                    },
                  }}
                  onClick={() => selectable && handleRowSelect(index)}
                >
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={selected.includes(index)}
                        sx={{
                          color: theme.colors.text.secondary,
                          '&.Mui-checked': {
                            color: theme.colors.primary[600],
                          },
                        }}
                      />
                    </TableCell>
                  )}
                  
                  {columns.map((column) => (
                    <TableCell
                      key={column.field}
                      align={column.align || 'left'}
                      sx={{
                        color: theme.colors.text.primary,
                        borderBottom: `1px solid ${theme.colors.border.light}`,
                      }}
                    >
                      {renderCellContent(row, column)}
                    </TableCell>
                  ))}
                  
                  {rowActions.length > 0 && (
                    <TableCell align="right" sx={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionMenuOpen(e, row, index);
                        }}
                        sx={{
                          color: theme.colors.text.secondary,
                          '&:hover': {
                            backgroundColor: alpha(theme.colors.primary[500], 0.1),
                            color: theme.colors.primary[600],
                          },
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {pagination && !loading && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            borderTop: `1px solid ${theme.colors.border.light}`,
            '& .MuiTablePagination-toolbar': {
              color: theme.colors.text.secondary,
            },
          }}
        />
      )}

      {/* Row Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: {
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border.light}`,
          },
        }}
      >
        {rowActions.map((action, index) => (
          <MenuItem
            key={index}
            onClick={() => handleActionClick(action)}
            sx={{
              gap: 1,
              color: action.color === 'error' ? theme.colors.error : theme.colors.text.primary,
              '&:hover': {
                backgroundColor: action.color === 'error' 
                  ? alpha(theme.colors.error, 0.1)
                  : theme.colors.background.hover,
              },
            }}
          >
            {action.icon && <Icon name={action.icon} size={16} />}
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );

  return title ? (
    <DashboardCard
      title={title}
      subtitle={subtitle}
      variant="outlined"
      className={`data-table-card ${className || ''}`}
      {...props}
    >
      {tableContent}
    </DashboardCard>
  ) : (
    <Box className={`data-table ${className || ''}`} {...props}>
      {tableContent}
    </Box>
  );
};

export default DataTable;
