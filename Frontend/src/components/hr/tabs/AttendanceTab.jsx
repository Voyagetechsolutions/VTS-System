import React, { useEffect, useState } from 'react';
import DashboardCard from '../../common/DashboardCard';
import DataTable from '../../common/DataTable';
import { ModernButton } from '../../common/FormComponents';
import { supabase } from '../../../supabase/client';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography } from '@mui/material';

export default function AttendanceTab() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanOutOpen, setScanOutOpen] = useState(false);
  const [kioskOpen, setKioskOpen] = useState(false);
  const [kioskMode, setKioskMode] = useState('in');
  const [staffId, setStaffId] = useState('');
  const [ticketText, setTicketText] = useState('');
  const [cameraLoaded, setCameraLoaded] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');
  useEffect(() => { (async () => { const { data } = await supabase.from('attendance').select('id, staff_id, check_in, check_out, status').eq('company_id', companyId).order('check_in', { ascending: false }); setRows(data||[]); })(); }, [companyId]);
  const reload = async () => { const { data } = await supabase.from('attendance').select('id, staff_id, check_in, check_out, status').eq('company_id', companyId).order('check_in', { ascending: false }); setRows(data||[]); };

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;
    let scriptEl = null;
    let scanner = null;
    const startScanner = () => {
      try {
        if (!window.Html5QrcodeScanner) return;
        const el = document.getElementById('hr-qr-reader');
        if (!el) return;
        const ScannerCtor = window.Html5QrcodeScanner;
        scanner = new ScannerCtor('hr-qr-reader', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
        scanner.render(async (decodedText) => {
          try {
            if (!decodedText) return;
            setTicketText(decodedText);
            await supabase.from('attendance').insert([{ company_id: companyId, staff_id: decodedText, check_in: new Date().toISOString(), status: 'present' }]);
            setScanOpen(false);
            setTicketText('');
            reload();
          } catch {
            // ignore; keep scanner running
          }
        }, () => {});
      } catch {}
    };
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => { if (!cancelled) { setCameraLoaded(true); setTimeout(startScanner, 200); } };
      document.body.appendChild(scriptEl);
    } else {
      setCameraLoaded(true);
      setTimeout(startScanner, 200);
    }
    return () => { cancelled = true; try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [scanOpen, companyId]);

  useEffect(() => {
    if (!scanOutOpen) return;
    let cancelled = false;
    let scriptEl = null;
    let scanner = null;
    const startScanner = () => {
      try {
        if (!window.Html5QrcodeScanner) return;
        const el = document.getElementById('hr-qr-reader-out');
        if (!el) return;
        const ScannerCtor = window.Html5QrcodeScanner;
        scanner = new ScannerCtor('hr-qr-reader-out', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
        scanner.render(async (decodedText) => {
          try {
            if (!decodedText) return;
            // Find latest open attendance for this staff and check-out
            const { data: openRows } = await supabase
              .from('attendance')
              .select('id, staff_id, check_in, check_out')
              .eq('company_id', companyId)
              .eq('staff_id', decodedText)
              .is('check_out', null)
              .order('check_in', { ascending: false })
              .limit(1);
            const row = Array.isArray(openRows) ? openRows[0] : null;
            if (!row) { alert('No active check-in found for this staff'); return; }
            await supabase.from('attendance').update({ check_out: new Date().toISOString(), status: 'completed' }).eq('id', row.id);
            setScanOutOpen(false);
            reload();
          } catch {}
        }, () => {});
      } catch {}
    };
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => { if (!cancelled) { setCameraLoaded(true); setTimeout(startScanner, 200); } };
      document.body.appendChild(scriptEl);
    } else {
      setCameraLoaded(true);
      setTimeout(startScanner, 200);
    }
    return () => { cancelled = true; try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [scanOutOpen, companyId]);

  useEffect(() => {
    if (!kioskOpen) return;
    let cancelled = false;
    let scriptEl = null;
    let scanner = null;
    const handleDecoded = async (code) => {
      try {
        if (!code) return;
        if (kioskMode === 'in') {
          await supabase.from('attendance').insert([{ company_id: companyId, staff_id: code, check_in: new Date().toISOString(), status: 'present' }]);
        } else {
          const { data: openRows } = await supabase
            .from('attendance')
            .select('id, staff_id, check_in, check_out')
            .eq('company_id', companyId)
            .eq('staff_id', code)
            .is('check_out', null)
            .order('check_in', { ascending: false })
            .limit(1);
          const row = Array.isArray(openRows) ? openRows[0] : null;
          if (!row) { alert('No active check-in found'); return; }
          await supabase.from('attendance').update({ check_out: new Date().toISOString(), status: 'completed' }).eq('id', row.id);
        }
        reload();
      } catch {}
    };
    const startScanner = () => {
      try {
        if (!window.Html5QrcodeScanner) return;
        const el = document.getElementById('hr-qr-reader-kiosk');
        if (!el) return;
        const ScannerCtor = window.Html5QrcodeScanner;
        scanner = new ScannerCtor('hr-qr-reader-kiosk', { fps: 10, qrbox: 220, rememberLastUsedCamera: true });
        scanner.render((decodedText) => { handleDecoded(decodedText); }, () => {});
      } catch {}
    };
    if (!window.Html5QrcodeScanner) {
      scriptEl = document.createElement('script');
      scriptEl.src = 'https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.10/minified/html5-qrcode.min.js';
      scriptEl.async = true;
      scriptEl.onload = () => { if (!cancelled) { setCameraLoaded(true); setTimeout(startScanner, 200); } };
      document.body.appendChild(scriptEl);
    } else {
      setCameraLoaded(true);
      setTimeout(startScanner, 200);
    }
    return () => { cancelled = true; try { scanner?.clear(); } catch {} if (scriptEl) { try { scriptEl.onload = null; } catch {} } };
  }, [kioskOpen, kioskMode, companyId]);
  return (
    <DashboardCard title="Attendance & Shift Scheduling" variant="outlined" headerAction={<Box sx={{ display: 'flex', gap: 1 }}><ModernButton icon="add" onClick={()=>setOpen(true)}>Check staff in</ModernButton><ModernButton icon="qr" onClick={()=>setScanOpen(true)}>Scan to check-in</ModernButton><ModernButton icon="qr" onClick={()=>setScanOutOpen(true)}>Scan to check-out</ModernButton><ModernButton icon="camera" onClick={()=>setKioskOpen(true)}>Open kiosk</ModernButton></Box>}>
      <DataTable data={rows} columns={[{ field: 'check_in', headerName: 'Check-in', type: 'date' }, { field: 'check_out', headerName: 'Check-out', type: 'date' }, { field: 'status', headerName: 'Status' }]} searchable pagination rowActions={[{ label: 'Check staff out', icon: 'check', onClick: async (row)=>{ await supabase.from('attendance').update({ check_out: new Date().toISOString(), status: 'completed' }).eq('id', row.id); reload(); } }]} />
      <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Check staff in</DialogTitle>
        <DialogContent>
          <TextField fullWidth size="small" label="Staff user_id" value={staffId} onChange={e=>setStaffId(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!staffId) return; await supabase.from('attendance').insert([{ company_id: companyId, staff_id: staffId, check_in: new Date().toISOString(), status: 'present' }]); setOpen(false); setStaffId(''); reload(); }}>Check-in</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={scanOpen} onClose={()=>setScanOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Scan to Check-in</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Scan a staff QR/ID or enter manually.</Typography>
          <div id="hr-qr-reader" style={{ width: '100%', display: cameraLoaded ? 'block' : 'none' }} />
          {!cameraLoaded && <Typography variant="caption" color="text.secondary">Loading camera…</Typography>}
          <TextField fullWidth size="small" label="Staff ID / Code" value={ticketText} onChange={e=>setTicketText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setScanOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!ticketText) return; await supabase.from('attendance').insert([{ company_id: companyId, staff_id: ticketText, check_in: new Date().toISOString(), status: 'present' }]); setScanOpen(false); setTicketText(''); reload(); }}>Check-in</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scanOutOpen} onClose={()=>setScanOutOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Scan to Check-out</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>Scan a staff QR/ID or enter manually.</Typography>
          <div id="hr-qr-reader-out" style={{ width: '100%', display: cameraLoaded ? 'block' : 'none' }} />
          {!cameraLoaded && <Typography variant="caption" color="text.secondary">Loading camera…</Typography>}
          <TextField fullWidth size="small" label="Staff ID / Code" value={ticketText} onChange={e=>setTicketText(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setScanOutOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={async ()=>{ if(!ticketText) return; const { data: openRows } = await supabase.from('attendance').select('id').eq('company_id', companyId).eq('staff_id', ticketText).is('check_out', null).order('check_in', { ascending: false }).limit(1); const row = Array.isArray(openRows) ? openRows[0] : null; if (!row) { alert('No active check-in found'); return; } await supabase.from('attendance').update({ check_out: new Date().toISOString(), status: 'completed' }).eq('id', row.id); setScanOutOpen(false); setTicketText(''); reload(); }}>Check-out</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={kioskOpen} onClose={()=>setKioskOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>HR Kiosk</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button variant={kioskMode==='in'?'contained':'outlined'} onClick={()=>setKioskMode('in')}>Check-in mode</Button>
            <Button variant={kioskMode==='out'?'contained':'outlined'} onClick={()=>setKioskMode('out')}>Check-out mode</Button>
          </Box>
          <div id="hr-qr-reader-kiosk" style={{ width: '100%' }} />
          <Typography variant="caption" color="text.secondary">Kiosk stays active for continuous scanning. Use the buttons to switch mode.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setKioskOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardCard>
  );
}
