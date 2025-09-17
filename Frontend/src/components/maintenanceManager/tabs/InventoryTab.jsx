import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Inventory as InventoryIcon, DirectionsBus as BusIcon, ShoppingCart as ShoppingCartIcon, QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';

export default function InventoryTab() {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [po, setPO] = useState([]);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => {
    const [{ data: s }, { data: u }, { data: p }] = await Promise.all([
      supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId),
      supabase.from('inventory_usage').select('id, item, bus_id, quantity, used_at').eq('company_id', companyId),
      supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId),
    ]);
    setStock(s||[]); setUsage(u||[]); setPO(p||[]);
  })(); }, [companyId]);
  const scanBarcode = async () => {
    const code = prompt('Scan/Enter Part Code');
    if (!code) return;
    const qty = Number(prompt('Quantity used?') || 1);
    await supabase.from('inventory_usage').insert({ company_id: companyId, item: code, quantity: qty });
    await supabase.from('inventory').update({ quantity: supabase.rpc ? undefined : undefined }).eq('company_id', companyId).eq('item', code); // placeholder; real decrement via trigger/RPC
    const { data: s } = await supabase.from('inventory').select('id, item, quantity, min_threshold, unit').eq('company_id', companyId);
    setStock(s||[]);
  };

  const autoOrderLow = async () => {
    const low = (stock||[]).filter(x => Number(x.quantity||0) <= Number(x.min_threshold||0));
    if (!low.length) return alert('No low stock items.');
    const rows = low.map(x => ({ company_id: companyId, item: x.item, quantity: (x.min_threshold||0) * 2, status: 'ordered' }));
    await supabase.from('purchase_orders').insert(rows);
    const { data: p } = await supabase.from('purchase_orders').select('id, item, quantity, status, expected_at').eq('company_id', companyId);
    setPO(p||[]);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory & Parts Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<QrCodeScannerIcon />}
            onClick={() => setShowAddUsage(true)}
          >
            Scan/Use Part
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddStock(true)}
          >
            Add Stock
          </Button>
        </Box>
      </Box>

      {/* Stock Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Stock Table</Typography>
          <DataTable
            data={stock}
            loading={loading}
            columns={[
              { 
                field: 'item', 
                headerName: 'Part',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'category', 
                headerName: 'Category',
                renderCell: (params) => (
                  <Chip 
                    label={params.value || 'General'} 
                    size="small" 
                    color="info"
                  />
                )
              },
              { 
                field: 'quantity', 
                headerName: 'Quantity Available',
                renderCell: (params) => {
                  const isLowStock = params.value <= params.row.min_threshold;
                  return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {params.value} {params.row.unit}
                      </Typography>
                      {isLowStock && (
                        <Chip 
                          label="Low Stock" 
                          size="small" 
                          color="warning"
                        />
                      )}
                    </Box>
                  );
                }
              },
              { 
                field: 'min_threshold', 
                headerName: 'Min Stock',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value} {params.row.unit}
                  </Typography>
                )
              }
            ]}
            rowActions={[
              { label: 'Add', icon: <AddIcon />, onClick: ({ row }) => console.log('Add', row) },
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'Deplete', icon: <DeleteIcon />, onClick: ({ row }) => handleDepleteStock(row.id, row.quantity) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Usage Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Usage Table</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowAddUsage(true)}
            >
              Quick Add Usage
            </Button>
          </Box>
          <DataTable
            data={usage}
            loading={loading}
            columns={[
              { 
                field: 'item', 
                headerName: 'Part',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'busPlate', 
                headerName: 'Bus / Vehicle',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.value}
                    </Typography>
                  </Box>
                )
              },
              { 
                field: 'quantity', 
                headerName: 'Quantity Used',
                renderCell: (params) => (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'used_at', 
                headerName: 'Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {new Date(params.value).toLocaleDateString()}
                  </Typography>
                )
              },
              { 
                field: 'staffName', 
                headerName: 'Responsible Staff',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value}
                  </Typography>
                )
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <InventoryIcon />, onClick: ({ row }) => console.log('View', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Procurement Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Procurement Table</Typography>
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              onClick={() => setShowAddProcurement(true)}
            >
              Add Procurement
            </Button>
          </Box>
          <DataTable
            data={procurement}
            loading={loading}
            columns={[
              { 
                field: 'item', 
                headerName: 'Part',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'supplier', 
                headerName: 'Supplier',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'quantity', 
                headerName: 'Quantity Ordered',
                renderCell: (params) => (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    {params.value}
                  </Typography>
                )
              },
              { 
                field: 'expected_at', 
                headerName: 'Expected Date',
                renderCell: (params) => (
                  <Typography variant="body2" color="text.secondary">
                    {params.value ? new Date(params.value).toLocaleDateString() : 'N/A'}
                  </Typography>
                )
              },
              { 
                field: 'status', 
                headerName: 'Status',
                renderCell: (params) => (
                  <Chip 
                    label={params.value} 
                    size="small" 
                    color={params.value === 'delivered' ? 'success' : params.value === 'ordered' ? 'warning' : 'default'}
                  />
                )
              }
            ]}
            rowActions={[
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <ShoppingCartIcon />, onClick: ({ row }) => console.log('View', row) }
            ]}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStockModal
        open={showAddStock}
        onClose={() => setShowAddStock(false)}
        onSave={handleAddStock}
      />
      <AddUsageModal
        open={showAddUsage}
        onClose={() => setShowAddUsage(false)}
        onSave={handleAddUsage}
      />
      <AddProcurementModal
        open={showAddProcurement}
        onClose={() => setShowAddProcurement(false)}
        onSave={handleAddProcurement}
      />
    </Box>
  );
}

// Add Stock Modal
function AddStockModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    item: '',
    category: '',
    quantity: '',
    min_threshold: '',
    unit: 'pcs'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Stock</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item/Part Name"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Engine, Brake, Electrical"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                select
              >
                <MenuItem value="pcs">Pieces</MenuItem>
                <MenuItem value="liters">Liters</MenuItem>
                <MenuItem value="kg">Kilograms</MenuItem>
                <MenuItem value="meters">Meters</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Threshold"
                type="number"
                value={formData.min_threshold}
                onChange={(e) => setFormData({ ...formData, min_threshold: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Add Stock</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Add Usage Modal
function AddUsageModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    item: '',
    bus_id: '',
    quantity: '',
    staff_id: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Quick Add Usage</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Part"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bus/Vehicle"
                value={formData.bus_id}
                onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Responsible Staff"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Add Usage</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Add Procurement Modal
function AddProcurementModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({
    item: '',
    supplier: '',
    quantity: '',
    expected_at: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Procurement</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Part"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Expected Date"
                type="date"
                value={formData.expected_at}
                onChange={(e) => setFormData({ ...formData, expected_at: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">Add Procurement</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
