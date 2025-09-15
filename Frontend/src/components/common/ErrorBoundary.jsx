import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Enhanced logging for iOS debugging
    const errorDetails = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      userAgent: navigator?.userAgent || 'Unknown browser',
      url: window?.location?.href || 'Unknown URL',
      timestamp: new Date().toISOString()
    };
    
    console.error('ErrorBoundary caught error:', errorDetails);
    
    // Try to send to monitoring service
    try {
      if (window.Sentry?.captureException) {
        window.Sentry.captureException(error, {
          contexts: { errorBoundary: errorDetails }
        });
      }
    } catch (sentryError) {
      console.warn('Failed to send to Sentry:', sentryError);
    }
  }
  
  handleReload = () => {
    window.location.reload();
  }
  
  render() {
    if (this.state.hasError) {
      const isDev = process.env.NODE_ENV === 'development';
      
      return this.props.fallback || (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              An unexpected error occurred. Please try refreshing the page.
            </Typography>
            
            {isDev && this.state.error && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="caption" component="pre" sx={{ 
                  fontSize: '0.7rem', 
                  overflow: 'auto',
                  maxHeight: 200,
                  backgroundColor: '#f8f8f8',
                  p: 1,
                  borderRadius: 1
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </Typography>
              </Box>
            )}
          </Alert>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={this.handleReload}
            sx={{ minWidth: 200 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
    
    return this.props.children;
  }
}


