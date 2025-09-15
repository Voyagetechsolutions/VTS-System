import { createTheme } from '@mui/material/styles';

// Blue/Grey system theme (modern grey + dark blue)
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0f4c81' }, // dark blue
    secondary: { main: '#475569' }, // slate grey
    background: { default: '#eef2f6', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          boxShadow: 'none'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(90deg, #0d3a63 0%, #0f4c81 50%, #125a9c 100%)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          borderRadius: 12
        }
      }
    }
  }
});

export default theme;


