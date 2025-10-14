import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, Alert, Box,
  Typography, LinearProgress
} from '@mui/material';
import {
  CloudUpload as UploadIcon, Description as FileIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function UploadDocumentModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: '',
    category: 'general'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const companyId = window.companyId || localStorage.getItem('companyId');
  const currentUserId = window.userId || localStorage.getItem('userId');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (!form.name) {
        setForm(prev => ({ ...prev, name: file.name }));
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      if (!selectedFile || !form.name.trim()) {
        setError('Please select a file and enter a document name');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      // Generate unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `company-${companyId}/${fileName}`;

      setUploadProgress(25);

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      // Insert document record into database
      const { error: insertError } = await supabase.from('documents').insert([{
        company_id: companyId,
        name: form.name.trim(),
        file_url: uploadData.path,
        file_type: selectedFile.type || 'application/octet-stream',
        uploaded_by: currentUserId,
        category: form.category
      }]);

      if (insertError) throw insertError;

      setUploadProgress(100);

      // Reset form
      setForm({
        name: '',
        category: 'general'
      });
      setSelectedFile(null);
      setUploadProgress(0);

      onSuccess();
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Error uploading document: ' + error.message);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        name: '',
        category: 'general'
      });
      setSelectedFile(null);
      setUploadProgress(0);
      setError('');
      onClose();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Uploading... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
        
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Box
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => document.getElementById('file-input').click()}
            >
              <input
                id="file-input"
                type="file"
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                disabled={loading}
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {selectedFile ? 'File Selected' : 'Click to Select File'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedFile 
                  ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                  : 'Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max 10MB)'
                }
              </Typography>
            </Box>
          </Grid>

          {selectedFile && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                <FileIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} sm={8}>
            <TextField
              fullWidth
              label="Document Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              disabled={loading}
              placeholder="Enter a descriptive name for the document"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={form.category}
                label="Category"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                disabled={loading}
              >
                <MenuItem value="general">General</MenuItem>
                <MenuItem value="license">License</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="policy">Policy</MenuItem>
                <MenuItem value="staff_records">Staff Records</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
                <MenuItem value="financial">Financial</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !selectedFile}
          startIcon={<UploadIcon />}
        >
          {loading ? 'Uploading...' : 'Upload Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
