import React from 'react';
import { Paper, Box, Typography, IconButton, Divider, alpha } from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { Icon } from './IconMap';
import theme from '../../styles/theme';

const DashboardCard = ({ 
  title, 
  subtitle, 
  children, 
  icon, 
  action, 
  headerAction,
  variant = 'default',
  size = 'medium',
  className,
  ...props 
}) => {
  const variants = {
    default: {
      backgroundColor: theme.colors.background.card,
      border: `1px solid ${theme.colors.border.light}`,
    },
    outlined: {
      backgroundColor: theme.colors.background.card,
      border: `2px solid ${theme.colors.border.medium}`,
    },
    elevated: {
      backgroundColor: theme.colors.background.card,
      boxShadow: theme.shadows.md,
      border: `1px solid ${theme.colors.border.light}`,
    },
    gradient: {
      background: `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[600]} 100%)`,
      color: theme.colors.text.inverse,
      border: 'none',
    },
    stats: {
      backgroundColor: theme.colors.background.card,
      border: `1px solid ${theme.colors.border.light}`,
      textAlign: 'center',
    }
  };

  const sizes = {
    small: { p: 2 },
    medium: { p: 3 },
    large: { p: 4 },
  };

  const cardStyle = {
    borderRadius: theme.borderRadius.lg,
    transition: theme.transitions.fast,
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows.lg,
    },
    ...variants[variant],
    ...sizes[size],
  };

  return (
    <Paper
      elevation={0}
      className={`dashboard-card ${className || ''}`}
      sx={cardStyle}
      {...props}
    >
      {/* Card Header */}
      {(title || icon || headerAction) && (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              mb: subtitle ? 1 : 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              {icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 48,
                    height: 48,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: variant === 'gradient' 
                      ? alpha(theme.colors.text.inverse, 0.2)
                      : alpha(theme.colors.primary[500], 0.1),
                    color: variant === 'gradient' 
                      ? theme.colors.text.inverse
                      : theme.colors.primary[600],
                  }}
                >
                  <Icon name={icon} size={24} />
                </Box>
              )}
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {title && (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: theme.typography.fontWeight.semibold,
                      color: variant === 'gradient' 
                        ? theme.colors.text.inverse 
                        : theme.colors.text.primary,
                      mb: subtitle ? 0.5 : 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {title}
                  </Typography>
                )}
                
                {subtitle && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: variant === 'gradient' 
                        ? alpha(theme.colors.text.inverse, 0.8)
                        : theme.colors.text.secondary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
            
            {headerAction && (
              <Box sx={{ ml: 2 }}>
                {headerAction}
              </Box>
            )}
          </Box>
          
          {subtitle && (
            <Divider 
              sx={{ 
                mb: 2,
                borderColor: variant === 'gradient' 
                  ? alpha(theme.colors.text.inverse, 0.2)
                  : theme.colors.border.light,
              }} 
            />
          )}
        </>
      )}
      
      {/* Card Content */}
      <Box
        sx={{
          color: variant === 'gradient' 
            ? theme.colors.text.inverse 
            : theme.colors.text.primary,
        }}
      >
        {children}
      </Box>
      
      {/* Card Action */}
      {action && (
        <>
          <Divider 
            sx={{ 
              mt: 2, 
              mb: 2,
              borderColor: variant === 'gradient' 
                ? alpha(theme.colors.text.inverse, 0.2)
                : theme.colors.border.light,
            }} 
          />
          <Box>{action}</Box>
        </>
      )}
    </Paper>
  );
};

// Specialized card variants
export const StatsCard = ({ title, value, trend, icon, color = 'primary', ...props }) => (
  <DashboardCard
    variant="stats"
    icon={icon}
    {...props}
  >
    <Typography
      variant="h3"
      sx={{
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors[color]?.[600] || theme.colors.primary[600],
        mb: 1,
      }}
    >
      {value}
    </Typography>
    <Typography
      variant="subtitle2"
      sx={{
        color: theme.colors.text.secondary,
        mb: trend ? 1 : 0,
      }}
    >
      {title}
    </Typography>
    {trend && (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          color: trend.direction === 'up' 
            ? theme.colors.success 
            : trend.direction === 'down' 
            ? theme.colors.error 
            : theme.colors.text.secondary,
        }}
      >
        <Icon 
          name={trend.direction === 'up' ? 'trendingUp' : 'trendingDown'} 
          size={16} 
        />
        <Typography variant="caption" sx={{ fontWeight: theme.typography.fontWeight.medium }}>
          {trend.value}
        </Typography>
      </Box>
    )}
  </DashboardCard>
);

export const AlertCard = ({ type = 'info', title, message, action, ...props }) => {
  const alertColors = {
    success: {
      backgroundColor: alpha(theme.colors.success, 0.1),
      borderColor: theme.colors.success,
      iconColor: theme.colors.success,
    },
    warning: {
      backgroundColor: alpha(theme.colors.warning, 0.1),
      borderColor: theme.colors.warning,
      iconColor: theme.colors.warning,
    },
    error: {
      backgroundColor: alpha(theme.colors.error, 0.1),
      borderColor: theme.colors.error,
      iconColor: theme.colors.error,
    },
    info: {
      backgroundColor: alpha(theme.colors.info, 0.1),
      borderColor: theme.colors.info,
      iconColor: theme.colors.info,
    },
  };

  const alertIcons = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    info: 'info',
  };

  return (
    <Paper
      sx={{
        ...alertColors[type],
        border: `1px solid ${alertColors[type].borderColor}`,
        borderRadius: theme.borderRadius.md,
        p: 2,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
      }}
      {...props}
    >
      <Icon 
        name={alertIcons[type]} 
        size={20} 
        color={alertColors[type].iconColor}
      />
      <Box sx={{ flex: 1 }}>
        {title && (
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text.primary,
              mb: message ? 0.5 : 0,
            }}
          >
            {title}
          </Typography>
        )}
        {message && (
          <Typography
            variant="body2"
            sx={{ color: theme.colors.text.secondary }}
          >
            {message}
          </Typography>
        )}
        {action && (
          <Box sx={{ mt: 1 }}>
            {action}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export const QuickActionCard = ({ actions = [], title, ...props }) => (
  <DashboardCard title={title} variant="outlined" {...props}>
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 2,
      }}
    >
      {actions.map((action, index) => (
        <Paper
          key={index}
          sx={{
            p: 2,
            textAlign: 'center',
            cursor: 'pointer',
            transition: theme.transitions.fast,
            backgroundColor: theme.colors.background.secondary,
            border: `1px solid ${theme.colors.border.light}`,
            borderRadius: theme.borderRadius.md,
            '&:hover': {
              backgroundColor: alpha(theme.colors.primary[500], 0.1),
              borderColor: theme.colors.primary[300],
              transform: 'translateY(-2px)',
            },
          }}
          onClick={action.onClick}
        >
          <Icon name={action.icon} size={24} color={theme.colors.primary[500]} />
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              display: 'block',
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.text.primary,
            }}
          >
            {action.label}
          </Typography>
        </Paper>
      ))}
    </Box>
  </DashboardCard>
);

export default DashboardCard;
