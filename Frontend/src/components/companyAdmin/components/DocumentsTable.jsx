import { useState } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  IconButton, Chip, Typography, Box
} from '@mui/material';
import {
  Visibility as ViewIcon, Edit as EditIcon, Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { supabase } from '../../../supabase/client';

export default function DocumentsTable({ documents, onUpdate }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleView = async (document) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('company-documents')
        .createSignedUrl(document.file_url, 3600); // 1 hour expiry

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Error viewing document: ' + error.message);
    }
  };

  const handleDownload = async (document) => {
    try {
      const { data, error } = await supabase
        .storage
        .from('company-documents')
        .download(document.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document: ' + error.message);
    }
  };

  const handleDelete = async (document) => {
    if (!window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase
        .storage
        .from('company-documents')
        .remove([document.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;

      onUpdate();
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error deleting document: ' + error.message);
    }
  };

  const getFileTypeColor = (fileType) => {
    if (!fileType) return 'default';
    
    if (fileType.includes('pdf')) return 'error';
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return 'success';
    if (fileType.includes('doc') || fileType.includes('word')) return 'primary';
    if (fileType.includes('xls') || fileType.includes('sheet')) return 'info';
    return 'default';
  };

  const getFileTypeLabel = (fileType) => {
    if (!fileType) return 'Unknown';
    
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return 'Image';
    if (fileType.includes('doc') || fileType.includes('word')) return 'Document';
    if (fileType.includes('xls') || fileType.includes('sheet')) return 'Spreadsheet';
    return fileType.split('/')[1]?.toUpperCase() || 'File';
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A';
    return new Date(dateTime).toLocaleString();
  };

  const generateDocumentId = (document) => {
    return `DOC${document.id.slice(-6).toUpperCase()}`;
  };

  return (
    <>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>File Type</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell>Upload Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {generateDocumentId(document)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {document.name || 'Untitled Document'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getFileTypeLabel(document.file_type)}
                    color={getFileTypeColor(document.file_type)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {document.uploader?.name || 'Unknown'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {document.uploader?.email || ''}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDateTime(document.uploaded_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleView(document)}
                      title="View Document"
                      color="info"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(document)}
                      title="Download Document"
                      color="success"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Edit Name"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(document)}
                      title="Delete Document"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={documents.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </>
  );
}
