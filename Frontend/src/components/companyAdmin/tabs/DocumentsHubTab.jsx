import { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, FormControl,
  InputLabel, Select, MenuItem, Grid, Alert
} from '@mui/material';
import {
  Add as AddIcon, Description as DocumentIcon, CloudUpload as UploadIcon,
  Folder as FolderIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';
import DocumentsTable from '../components/DocumentsTable';
import UploadDocumentModal from '../components/UploadDocumentModal';

export default function DocumentsHubTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const companyId = window.companyId || localStorage.getItem('companyId');

  // Modal states
  const [showUploadDocument, setShowUploadDocument] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    fileType: '',
    uploadedBy: ''
  });

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    pdfDocuments: 0,
    imageDocuments: 0,
    otherDocuments: 0
  });

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          uploader:uploaded_by(name, email)
        `)
        .eq('company_id', companyId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
      await loadMetrics();
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const loadMetrics = useCallback(async () => {
    try {
      const [
        { count: totalDocuments },
        { count: pdfDocuments },
        { count: imageDocuments }
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).ilike('file_type', '%pdf%'),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('company_id', companyId).or('file_type.ilike.%image%,file_type.ilike.%jpg%,file_type.ilike.%png%')
      ]);

      const otherDocuments = (totalDocuments || 0) - (pdfDocuments || 0) - (imageDocuments || 0);

      setMetrics({
        totalDocuments: totalDocuments || 0,
        pdfDocuments: pdfDocuments || 0,
        imageDocuments: imageDocuments || 0,
        otherDocuments: Math.max(0, otherDocuments)
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  }, [companyId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const filteredDocuments = documents.filter(doc => {
    const searchTerm = filters.search.toLowerCase();
    return (
      (!filters.search || 
        doc.name?.toLowerCase().includes(searchTerm) ||
        doc.uploader?.name?.toLowerCase().includes(searchTerm)) &&
      (!filters.fileType || doc.file_type?.includes(filters.fileType)) &&
      (!filters.uploadedBy || doc.uploader?.name === filters.uploadedBy)
    );
  });

  const handleDocumentSuccess = () => {
    setShowUploadDocument(false);
    loadDocuments();
  };

  // Get unique uploaders for filter
  const uniqueUploaders = [...new Set(documents.map(doc => doc.uploader?.name).filter(Boolean))];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Documents Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowUploadDocument(true)}
        >
          Upload Document
        </Button>
      </Box>

      {/* Dashboard Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DocumentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">{metrics.totalDocuments}</Typography>
              <Typography variant="body2" color="text.secondary">Total Documents</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <FolderIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">{metrics.pdfDocuments}</Typography>
              <Typography variant="body2" color="text.secondary">PDF Files</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <UploadIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">{metrics.imageDocuments}</Typography>
              <Typography variant="body2" color="text.secondary">Images</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <DocumentIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="info.main">{metrics.otherDocuments}</Typography>
              <Typography variant="body2" color="text.secondary">Other Files</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Search & Filters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search documents"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Search by document name or uploader..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>File Type</InputLabel>
                <Select
                  value={filters.fileType}
                  label="File Type"
                  onChange={(e) => handleFilterChange('fileType', e.target.value)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="image">Images</MenuItem>
                  <MenuItem value="doc">Documents</MenuItem>
                  <MenuItem value="xls">Spreadsheets</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Uploaded By</InputLabel>
                <Select
                  value={filters.uploadedBy}
                  label="Uploaded By"
                  onChange={(e) => handleFilterChange('uploadedBy', e.target.value)}
                >
                  <MenuItem value="">All Users</MenuItem>
                  {uniqueUploaders.map((uploader) => (
                    <MenuItem key={uploader} value={uploader}>
                      {uploader}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Company Documents</Typography>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => setShowUploadDocument(true)}
              size="small"
            >
              Upload Document
            </Button>
          </Box>
          {filteredDocuments.length === 0 ? (
            <Alert severity="info">
              No documents found. Upload your first document using the "Upload Document" button.
            </Alert>
          ) : (
            <DocumentsTable 
              documents={filteredDocuments} 
              loading={loading}
              onUpdate={loadDocuments}
            />
          )}
        </CardContent>
      </Card>

      {/* Upload Document Modal */}
      <UploadDocumentModal
        open={showUploadDocument}
        onClose={() => setShowUploadDocument(false)}
        onSuccess={handleDocumentSuccess}
      />
    </Box>
  );
}
