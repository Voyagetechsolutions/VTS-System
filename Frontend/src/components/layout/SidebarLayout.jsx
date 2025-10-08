import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Select,
  FormControl,
  Collapse,
  Paper,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { supabase } from '../../supabase/client';
import { getBranches, getCompanyAlertsFeed } from '../../supabase/api';
import { Icon, roleNavigation } from '../common/IconMap';
import theme from '../../styles/theme';
import '../../styles/globalStyles.css';

const drawerWidth = 280;
const drawerWidthCollapsed = 72;

export default function SidebarLayout({ children, title, navItems }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState(
    JSON.parse(localStorage.getItem('expandedGroups') || '{}')
  );
  const [notificationsCount, setNotificationsCount] = useState(
    JSON.parse(localStorage.getItem('notificationsCount') || '0')
  );

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const isTablet = useMediaQuery(muiTheme.breakpoints.down('lg'));

  useEffect(() => {
    loadBranches();
    // Auto-collapse sidebar on tablets
    if (isTablet && !isMobile) {
      setSidebarCollapsed(true);
      // Load notifications count
(async () => {
  try {
    const { data } = await getCompanyAlertsFeed();
    setNotificationsCount((data || []).length);
  } catch {
    setNotificationsCount(0);
  }
})();
    }
  }, [isTablet, isMobile]);

  const loadBranches = async () => {
    try {
      const { data } = await getBranches();
      setBranches(data || []);
      
      const storedBranchId = localStorage.getItem('branchId');
      if (storedBranchId) {
        setSelectedBranch(storedBranchId);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleBranchChange = async (branchId) => {
    setSelectedBranch(branchId);
    localStorage.setItem('branchId', branchId);
    window.userBranchId = branchId;
    
    try {
      await supabase.auth.updateUser({
        data: { branch_id: branchId }
      });
    } catch (error) {
      console.error('Failed to update user metadata:', error);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.replace('/');
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const userRole = window.userRole || localStorage.getItem('userRole');
  const userName = window.user?.name || localStorage.getItem('userName') || 'User';
  const userEmail = window.user?.email || localStorage.getItem('userEmail') || '';
  const companyName = window.companyName || 'VTS Company';

  const deriveIconName = (label) => {
    const key = String(label || '').toLowerCase();
    if (key.includes('overview') || key.includes('home')) return 'dashboard';
    if (key.includes('compan')) return 'business';
    if (key.includes('user')) return 'users';
    if (key.includes('driver')) return 'driver';
    if (key.includes('fleet') || key.includes('bus')) return 'bus';
    if (key.includes('route') || key.includes('trip')) return 'route';
    if (key.includes('booking') || key.includes('ticket')) return 'bookings';
    if (key.includes('report') || key.includes('analytic')) return 'reports';
    if (key.includes('revenue') || key.includes('billing') || key.includes('subscription') || key.includes('payment')) return 'revenue';
    if (key.includes('maintenance')) return 'maintenance';
    if (key.includes('compliance') || key.includes('safety')) return 'safety';
    if (key.includes('document')) return 'documents';
    if (key.includes('communicat') || key.includes('message')) return 'communications';
    if (key.includes('notification') || key.includes('alert')) return 'notifications';
    if (key.includes('audit') || key.includes('log')) return 'history';
    if (key.includes('branch')) return 'branches';
    if (key.includes('setting') || key.includes('preference')) return 'settings';
    if (key.includes('support') || key.includes('help')) return 'support';
    if (key.includes('security') || key.includes('access')) return 'security';
    if (key.includes('monitor') || key.includes('system')) return 'system';
    return 'dashboard';
  };

  // Group navigation items for better organization
  const groupedNavItems = (navItems || []).reduce((groups, item, index) => {
    const group = item.group || 'main';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ ...item, originalIndex: index });
    return groups;
  }, {});

  const currentDrawerWidth = sidebarCollapsed ? drawerWidthCollapsed : drawerWidth;

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.background.sidebar,
        color: theme.colors.text.inverse,
        position: 'relative',
        transition: theme.transitions.normal,
      }}
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          borderBottom: `1px solid ${alpha(theme.colors.text.inverse, 0.1)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          minHeight: 64,
        }}
      >
        {!sidebarCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ color: theme.colors.primary[400] }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.inverse,
              }}
            >
              VTS System
            </Typography>
          </Box>
        )}
        
        {!isMobile && (
          <IconButton
            onClick={handleSidebarToggle}
            sx={{
              color: theme.colors.text.inverse,
              '&:hover': {
                backgroundColor: alpha(theme.colors.text.inverse, 0.1),
              },
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {/* User Info */}
      {!sidebarCollapsed && (
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${alpha(theme.colors.text.inverse, 0.1)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                backgroundColor: theme.colors.primary[500],
                fontSize: theme.typography.fontSize.lg,
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.text.inverse,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: alpha(theme.colors.text.inverse, 0.7),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {userEmail}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={userRole?.replace('_', ' ').toUpperCase()}
            size="small"
            sx={{
              backgroundColor: alpha(theme.colors.primary[400], 0.2),
              color: theme.colors.primary[100],
              fontSize: '10px',
              height: 20,
            }}
          />
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        <List sx={{ pt: 0 }}>
          {Object.entries(groupedNavItems).map(([groupId, groupItems]) => (
            <React.Fragment key={groupId}>
              {groupId !== 'main' && !sidebarCollapsed && (
                <ListItem
                  sx={{
                    py: 1,
                    px: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: alpha(theme.colors.text.inverse, 0.05),
                    },
                  }}
                  onClick={() => toggleGroup(groupId)}
                >
                  <ListItemText
                    primary={groupId.charAt(0).toUpperCase() + groupId.slice(1)}
                    primaryTypographyProps={{
                      variant: 'caption',
                      sx: {
                        color: alpha(theme.colors.text.inverse, 0.6),
                        fontWeight: theme.typography.fontWeight.semibold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      },
                    }}
                  />
                  <ListItemIcon sx={{ minWidth: 'auto', color: alpha(theme.colors.text.inverse, 0.6) }}>
                    {expandedGroups[groupId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </ListItemIcon>
                </ListItem>
              )}
              
              <Collapse in={groupId === 'main' || expandedGroups[groupId] || sidebarCollapsed} timeout="auto">
                {groupItems.map((item) => (
                  <Tooltip
                    key={item.originalIndex}
                    title={sidebarCollapsed ? item.label : ''}
                    placement="right"
                    arrow
                  >
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                      <ListItemButton
                        selected={item.selected}
                        onClick={item.onClick}
                        sx={{
                          mx: 1,
                          borderRadius: theme.borderRadius.md,
                          minHeight: 48,
                          justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                          px: sidebarCollapsed ? 1 : 2,
                          transition: theme.transitions.fast,
                          '&:hover': {
                            backgroundColor: alpha(theme.colors.text.inverse, 0.08),
                            transform: 'translateX(4px)',
                          },
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.colors.primary[400], 0.15),
                            borderLeft: `3px solid ${theme.colors.primary[400]}`,
                            '&:hover': {
                              backgroundColor: alpha(theme.colors.primary[400], 0.2),
                            },
                          },
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: sidebarCollapsed ? 'auto' : 40,
                            color: item.selected 
                              ? theme.colors.primary[300] 
                              : alpha(theme.colors.text.inverse, 0.8),
                            justifyContent: 'center',
                          }}
                        >
                          <Icon name={item.icon || deriveIconName(item.label)} size={20} />
                        </ListItemIcon>
                        {!sidebarCollapsed && (
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              variant: 'body2',
                              sx: {
                                fontWeight: item.selected 
                                  ? theme.typography.fontWeight.semibold 
                                  : theme.typography.fontWeight.medium,
                                color: item.selected 
                                  ? theme.colors.primary[100] 
                                  : theme.colors.text.inverse,
                              },
                            }}
                          />
                        )}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>
                ))}
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.colors.background.secondary }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          backgroundColor: theme.colors.background.primary,
          borderBottom: `1px solid ${theme.colors.border.light}`,
          color: theme.colors.text.primary,
          transition: theme.transitions.normal,
          zIndex: { xs: 1300, md: 1200 }, // Ensure proper layering on mobile
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: theme.typography.fontWeight.semibold,
                color: theme.colors.text.primary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {`Welcome back, ${userName}`}
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: theme.colors.text.secondary }}
            >
              {title}
            </Typography>
          </Box>
          
          {/* Branch Selector for Booking Office */}
          {userRole === 'booking_officer' && branches.length > 0 && (
            <FormControl sx={{ mr: { xs: 1, sm: 2 }, minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', sm: 'block' } }}>
              <Select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                displayEmpty
                size="small"
                sx={{
                  backgroundColor: theme.colors.background.primary,
                  borderRadius: theme.borderRadius.md,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.colors.border.medium,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: theme.colors.primary[500],
                  },
                }}
              >
                <MenuItem value="">
                  <em>Select Branch</em>
                </MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id}>
                    <Icon name="branches" size={16} />
                    <Box sx={{ ml: 1 }}>{branch.name}</Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <IconButton 
            color="inherit"
            sx={{
              mr: 1,
              '&:hover': {
                backgroundColor: alpha(theme.colors.primary[500], 0.1),
              },
            }}
            onClick={() => {
              // Try to find a nav item labeled Notifications and click it
              const notifIndex = (navItems || []).findIndex(i => String(i.label).toLowerCase().includes('notification'));
              if (notifIndex >= 0 && navItems[notifIndex]?.onClick) {
                navItems[notifIndex].onClick();
              } else {
                // Fallback: route by hash/URL if app uses route segments
                try { window.location.hash = '#/notifications'; } catch {}
              }
            }}
          >
            <Badge badgeContent={notificationsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.colors.primary[500], 0.1),
              },
            }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                backgroundColor: theme.colors.primary[500],
                fontSize: theme.typography.fontSize.sm,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        PaperProps={{
          sx: {
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border.light}`,
            mt: 1,
          },
        }}
      >
        <MenuItem 
          onClick={() => {
            handleProfileMenuClose();
            // Navigate to profile tab if present in nav
            const profileIdx = (navItems || []).findIndex(i => String(i.label).toLowerCase().includes('profile'));
            if (profileIdx >= 0 && navItems[profileIdx]?.onClick) navItems[profileIdx].onClick();
            else try { window.location.hash = '#/profile'; } catch {}
          }}
          sx={{
            '&:hover': {
              backgroundColor: theme.colors.background.hover,
            },
          }}
        >
          <AccountIcon sx={{ mr: 2, color: theme.colors.text.secondary }} />
          Profile
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleProfileMenuClose();
            const settingsIdx = (navItems || []).findIndex(i => String(i.label).toLowerCase().includes('setting'));
            if (settingsIdx >= 0 && navItems[settingsIdx]?.onClick) navItems[settingsIdx].onClick();
            else try { window.location.hash = '#/settings'; } catch {}
          }}
          sx={{
            '&:hover': {
              backgroundColor: theme.colors.background.hover,
            },
          }}
        >
          <SettingsIcon sx={{ mr: 2, color: theme.colors.text.secondary }} />
          Settings
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            color: theme.colors.error,
            '&:hover': {
              backgroundColor: alpha(theme.colors.error, 0.1),
            },
          }}
        >
          <LogoutIcon sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ 
          width: { md: currentDrawerWidth }, 
          flexShrink: { md: 0 },
          transition: theme.transitions.normal,
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {sidebarContent}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              border: 'none',
              transition: theme.transitions.normal,
            },
          }}
          open
        >
          {sidebarContent}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 }, 
          width: { xs: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          transition: theme.transitions.normal,
          backgroundColor: theme.colors.background.secondary,
          minHeight: '100vh',
          overflow: 'hidden',
        }}
      >
        <Toolbar />
        <Box 
          className="fade-in"
          sx={{
            maxWidth: '100%',
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch', // iOS smooth scrolling
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}