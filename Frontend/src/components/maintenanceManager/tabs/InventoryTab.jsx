import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip, IconButton, Avatar, Grid, FormControlLabel, Switch } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Inventory as InventoryIcon, DirectionsBus as BusIcon, ShoppingCart as ShoppingCartIcon, QrCodeScanner as QrCodeScannerIcon } from '@mui/icons-material';
import DataTable from '../../common/DataTable';
import { supabase } from '../../../supabase/client';
import { getCompanySettings } from '../../../supabase/api';

export default function InventoryTab() {
  const [stock, setStock] = useState([]);
  const [usage, setUsage] = useState([]);
  const [procurement, setProcurement] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddUsage, setShowAddUsage] = useState(false);
  const [showAddProcurement, setShowAddProcurement] = useState(false);
  const [canEdit, setCanEdit] = useState(true);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const stockQ = supabase
          .from('inventory_stock')
          .select('id, part_name, quantity, location, status')
          .eq('company_id', companyId)
          .order('part_name');
        const usageQ = supabase
          .from('inventory_usage')
          .select('id, part_id, bus_id, quantity, used_at, staff, inventory_stock:part_id(part_name)')
          .eq('company_id', companyId)
          .order('used_at', { ascending: false });
        const procureQ = supabase
          .from('inventory_procurement')
          .select('id, supplier, part_name, quantity, delivery_date, status')
          .eq('company_id', companyId)
          .order('delivery_date', { ascending: false });
        const [{ data: s }, { data: u }, { data: p }] = await Promise.all([stockQ, usageQ, procureQ]);
        setStock((s||[]).map(r => ({ id: r.id, item: r.part_name, quantity: r.quantity, location: r.location, status: r.status })));
        setUsage((u||[]).map(r => ({ id: r.id, item: r.inventory_stock?.part_name || '(unknown)', bus_id: r.bus_id, quantity: r.quantity, used_at: r.used_at, staff_id: r.staff })));
        setProcurement((p||[]).map(r => ({ id: r.id, item: r.part_name, supplier: r.supplier, quantity: r.quantity, expected_at: r.delivery_date, status: r.status })));
      } catch (error) {
        console.error('Error fetching inventory data:', error);
      } finally {
        setLoading(false);
      }
    })();
    (async () => { try { const role = window.userRole || (window.user?.role) || localStorage.getItem('userRole') || 'admin'; const { data } = await getCompanySettings(); setCanEdit(!!(data?.rbac?.[role]?.edit)); } catch { setCanEdit(true); } })();
  }, [companyId]);
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
    const low = (stock||[]).filter(x => (x.status||'').toLowerCase() === 'low');
    if (!low.length) return alert('No low stock items marked low.');
    const rows = low.map(x => ({ company_id: companyId, part_name: x.item, quantity: Number(x.quantity||0) + 10, status: 'ordered' }));
    await supabase.from('inventory_procurement').insert(rows);
    const { data: p } = await supabase.from('inventory_procurement').select('id, supplier, part_name, quantity, delivery_date, status').eq('company_id', companyId);
    setProcurement((p||[]).map(r => ({ id: r.id, item: r.part_name, supplier: r.supplier, quantity: r.quantity, expected_at: r.delivery_date, status: r.status })));
  };

  const handleAddStock = async (formData) => {
    try {
      await supabase.from('inventory_stock').insert([{
        company_id: companyId,
        part_name: formData.item,
        quantity: Number(formData.quantity),
        location: formData.location || null,
        status: formData.status || 'ok',
      }]);
      const { data: s } = await supabase.from('inventory_stock').select('id, part_name, quantity, location, status').eq('company_id', companyId);
      setStock((s||[]).map(r => ({ id: r.id, item: r.part_name, quantity: r.quantity, location: r.location, status: r.status })));
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const handleAddUsage = async (formData) => {
    try {
      // Resolve part_id by part_name; create stock item if missing
      const partName = formData.item;
      let { data: stockRows } = await supabase.from('inventory_stock').select('id').eq('company_id', companyId).eq('part_name', partName).limit(1);
      let part_id = stockRows?.[0]?.id;
      if (!part_id) {
        const { data: inserted, error } = await supabase.from('inventory_stock').insert([{ company_id: companyId, part_name: partName, quantity: 0, status: 'ok' }]).select('id').single();
        if (!error) part_id = inserted?.id;
      }
      if (!part_id) throw new Error('Failed to resolve part_id');
      await supabase.from('inventory_usage').insert([{ company_id: companyId, part_id, bus_id: formData.bus_id || null, quantity: Number(formData.quantity), staff: formData.staff_id || null }]);
      const { data: u } = await supabase
        .from('inventory_usage')
        .select('id, part_id, bus_id, quantity, used_at, staff, inventory_stock:part_id(part_name)')
        .eq('company_id', companyId)
        .order('used_at', { ascending: false });
      setUsage((u||[]).map(r => ({ id: r.id, item: r.inventory_stock?.part_name || '(unknown)', bus_id: r.bus_id, quantity: r.quantity, used_at: r.used_at, staff_id: r.staff })));
    } catch (error) {
      console.error('Error adding usage:', error);
    }
  };

  const handleAddProcurement = async (formData) => {
    try {
      await supabase.from('inventory_procurement').insert([{ company_id: companyId, part_name: formData.item, supplier: formData.supplier || null, quantity: Number(formData.quantity), delivery_date: formData.expected_at || null, status: 'ordered' }]);
      const { data: p } = await supabase.from('inventory_procurement').select('id, supplier, part_name, quantity, delivery_date, status').eq('company_id', companyId);
      setProcurement((p||[]).map(r => ({ id: r.id, item: r.part_name, supplier: r.supplier, quantity: r.quantity, expected_at: r.delivery_date, status: r.status })));
    } catch (error) {
      console.error('Error adding procurement:', error);
    }
  };

  const handleDepleteStock = async (id, currentQuantity) => {
    const qty = Number(prompt('Quantity to deplete?') || 0);
    if (qty <= 0) return;
    try {
      await supabase.from('inventory').update({ quantity: currentQuantity - qty }).eq('id', id);
      // Refresh data
      const { data: s } = await supabase.from('inventory').select('id, item, quantity, min_threshold, unit, category').eq('company_id', companyId);
      setStock(s||[]);
    } catch (error) {
      console.error('Error depleting stock:', error);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inventory & Parts Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {canEdit && (
            <Button variant="outlined" startIcon={<QrCodeScannerIcon />} onClick={() => setShowAddUsage(true)}>
              Scan/Use Part
            </Button>
          )}
          {canEdit && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddStock(true)}>
              Add Stock
            </Button>
          )}
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
              { field: 'location', headerName: 'Location' },
              { 
                field: 'quantity', 
                headerName: 'Quantity Available',
                renderCell: (params) => (
                  <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
                )
              },
              { field: 'status', headerName: 'Status', renderCell: (p) => <Chip label={p.value||'ok'} size="small" color={(p.value||'ok')==='low'?'warning':(p.value||'ok')==='out'?'error':'success'} /> }
            ]}
            rowActions={canEdit ? [
              { label: 'Add', icon: <AddIcon />, onClick: ({ row }) => console.log('Add', row) },
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'Deplete', icon: <DeleteIcon />, onClick: ({ row }) => handleDepleteStock(row.id, row.quantity) }
            ] : []}
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
            {canEdit && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowAddUsage(true)}>
                Quick Add Usage
              </Button>
            )}
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
                field: 'bus_id', 
                headerName: 'Bus / Vehicle',
                renderCell: (params) => (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {params.value || 'N/A'}
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
                field: 'staff_id', 
                headerName: 'Responsible Staff',
                renderCell: (params) => (
                  <Typography variant="body2">
                    {params.value || 'N/A'}
                  </Typography>
                )
              }
            ]}
            rowActions={canEdit ? [
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <InventoryIcon />, onClick: ({ row }) => console.log('View', row) }
            ] : []}
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
            {canEdit && (
              <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={() => setShowAddProcurement(true)}>
                Add Procurement
              </Button>
            )}
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
            rowActions={canEdit ? [
              { label: 'Edit', icon: <EditIcon />, onClick: ({ row }) => console.log('Edit', row) },
              { label: 'View Details', icon: <ShoppingCartIcon />, onClick: ({ row }) => console.log('View', row) }
            ] : []}
            searchable
            pagination
          />
        </CardContent>
      </Card>

      {/* Modals */}
      {canEdit && <AddStockModal
        open={showAddStock}
        onClose={() => setShowAddStock(false)}
        onSave={handleAddStock}
      />}
      {canEdit && <AddUsageModal
        open={showAddUsage}
        onClose={() => setShowAddUsage(false)}
        onSave={handleAddUsage}
      />}
      {canEdit && <AddProcurementModal
        open={showAddProcurement}
        onClose={() => setShowAddProcurement(false)}
        onSave={handleAddProcurement}
      />}
    </Box>
  );
}

// Add Stock Modal
function AddStockModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({ item: '', quantity: '', location: '', status: 'ok' });

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
            <Grid item xs={12} sm={6}><TextField fullWidth label="Location" value={formData.location} onChange={(e)=>setFormData({...formData, location: e.target.value})} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Status" value={formData.status} onChange={(e)=>setFormData({...formData, status: e.target.value})} placeholder="ok/low/out" /></Grid>
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
