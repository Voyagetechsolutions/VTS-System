import React from 'react';
import { Box, Grid, Container, Typography, Breadcrumbs, Link } from '@mui/material';
import { StatsCard } from './DashboardCard';
import theme from '../../styles/theme';

// Responsive dashboard grid container
export const DashboardGrid = ({ children, spacing = 3, maxWidth = 'xl', ...props }) => (
  <Container maxWidth={maxWidth} sx={{ py: 0 }}>
    <Grid container spacing={spacing} {...props}>
      {children}
    </Grid>
  </Container>
);

// Grid item with responsive sizing
export const GridItem = ({ 
  xs = 12, 
  sm, 
  md, 
  lg, 
  xl, 
  children, 
  className,
  ...props 
}) => (
  <Grid 
    item 
    xs={xs} 
    sm={sm} 
    md={md} 
    lg={lg} 
    xl={xl} 
    className={`grid-item ${className || ''}`}
    {...props}
  >
    {children}
  </Grid>
);

// Dashboard section with title and responsive layout
export const DashboardSection = ({ 
  title, 
  subtitle, 
  children, 
  spacing = 3,
  headerAction,
  className,
  ...props 
}) => (
  <Box className={`dashboard-section ${className || ''}`} sx={{ mb: 4 }} {...props}>
    {(title || subtitle || headerAction) && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          {title && (
            <Typography
              variant="h5"
              sx={{
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                mb: subtitle ? 0.5 : 0,
              }}
            >
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: theme.colors.text.secondary,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {headerAction && (
          <Box>{headerAction}</Box>
        )}
      </Box>
    )}
    
    <Grid container spacing={spacing}>
      {children}
    </Grid>
  </Box>
);

// Quick stats row for dashboard overview
export const StatsRow = ({ stats = [], ...props }) => (
  <DashboardSection {...props}>
    {stats.map((stat, index) => (
      <GridItem key={index} xs={12} sm={6} md={3}>
        <StatsCard {...stat} />
      </GridItem>
    ))}
  </DashboardSection>
);

// Responsive card grid
export const CardGrid = ({ 
  items = [], 
  renderCard, 
  xs = 12, 
  sm = 6, 
  md = 4, 
  lg = 3,
  spacing = 3,
  ...props 
}) => (
  <Grid container spacing={spacing} {...props}>
    {items.map((item, index) => (
      <GridItem key={index} xs={xs} sm={sm} md={md} lg={lg}>
        {renderCard ? renderCard(item, index) : item}
      </GridItem>
    ))}
  </Grid>
);

// Dashboard layout presets for different screen sizes
export const DashboardLayout = {
  // Overview layout - stats and quick actions
  overview: {
    statsRow: { xs: 12, sm: 6, md: 3 },
    mainContent: { xs: 12, md: 8 },
    sidebar: { xs: 12, md: 4 },
    fullWidth: { xs: 12 },
  },
  
  // Management layout - tables and forms
  management: {
    header: { xs: 12 },
    filters: { xs: 12, md: 4 },
    content: { xs: 12, md: 8 },
    table: { xs: 12 },
  },
  
  // Analytics layout - charts and metrics
  analytics: {
    kpi: { xs: 12, sm: 6, lg: 3 },
    chart: { xs: 12, lg: 6 },
    fullChart: { xs: 12 },
    metric: { xs: 12, sm: 6, md: 4 },
  },
  
  // Profile layout - forms and settings
  profile: {
    main: { xs: 12, md: 8 },
    sidebar: { xs: 12, md: 4 },
    section: { xs: 12 },
  },
};

// Responsive breakpoint utility
export const useResponsiveLayout = () => {
  const isXs = window.innerWidth < 600;
  const isSm = window.innerWidth >= 600 && window.innerWidth < 960;
  const isMd = window.innerWidth >= 960 && window.innerWidth < 1280;
  const isLg = window.innerWidth >= 1280 && window.innerWidth < 1920;
  const isXl = window.innerWidth >= 1920;
  
  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isMobile: isXs || isSm,
    isTablet: isMd,
    isDesktop: isLg || isXl,
  };
};

// Layout wrapper with proper spacing and background
export const LayoutWrapper = ({ children, className, ...props }) => (
  <Box
    className={`layout-wrapper ${className || ''}`}
    sx={{
      minHeight: '100vh',
      backgroundColor: theme.colors.background.secondary,
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

// Content area with consistent padding
export const ContentArea = ({ children, className, maxWidth = 'xl', ...props }) => (
  <Container
    maxWidth={maxWidth}
    className={`content-area ${className || ''}`}
    sx={{
      py: { xs: 2, md: 3 },
      px: { xs: 2, md: 3 },
      ...props.sx,
    }}
    {...props}
  >
    {children}
  </Container>
);

// Page header with breadcrumbs and actions
export const PageHeader = ({ 
  title, 
  subtitle, 
  breadcrumbs = [], 
  actions = [],
  className,
  ...props 
}) => (
  <Box
    className={`page-header ${className || ''}`}
    sx={{
      mb: 4,
      pb: 2,
      borderBottom: `1px solid ${theme.colors.border.light}`,
      ...props.sx,
    }}
    {...props}
  >
    {/* Breadcrumbs */}
    {breadcrumbs.length > 0 && (
      <Box sx={{ mb: 1 }}>
        <Breadcrumbs separator="/" sx={{ fontSize: theme.typography.fontSize.sm }}>
          {breadcrumbs.map((crumb, index) => (
            <Link
              key={index}
              color={index === breadcrumbs.length - 1 ? 'text.primary' : 'text.secondary'}
              href={crumb.href}
              underline="hover"
              sx={{ fontSize: theme.typography.fontSize.sm }}
            >
              {crumb.label}
            </Link>
          ))}
        </Breadcrumbs>
      </Box>
    )}
    
    {/* Title and Actions */}
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.primary,
            mb: subtitle ? 0.5 : 0,
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="body1"
            sx={{
              color: theme.colors.text.secondary,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {actions.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {actions}
        </Box>
      )}
    </Box>
  </Box>
);

export default {
  DashboardGrid,
  GridItem,
  DashboardSection,
  StatsRow,
  CardGrid,
  DashboardLayout,
  useResponsiveLayout,
  LayoutWrapper,
  ContentArea,
  PageHeader,
};
