import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  AppBar,
  Box,
  CssBaseline,
  Badge,
  Drawer,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
  ListItemSecondaryAction,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  Assessment as AssessmentIcon,
  Receipt as ReceiptIcon,
  AccountBalance as AccountBalanceIcon,
  ExitToApp as LogoutIcon,
  Notifications as NotificationsIcon,
  CheckCircleOutline as CheckIcon,
  Cancel as CancelIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { logout } from '../store/authSlice';
import type { RootState } from '../store/store';
import api from '../utils/axios';

const drawerWidth = 240;

const MainLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      content: string;
      date: string;
      customer?: { externalId?: string; username?: string };
    }>
  >([]);
  const [notificationsTotal, setNotificationsTotal] = useState(0);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const formatFollowUpTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();
      if (sameDay) {
        return `Today ${d.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;
      }
      if (isYesterday) {
        return `Yesterday ${d.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })}`;
      }
      return d.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const handleOpenNotifications = async (
    event: React.MouseEvent<HTMLElement>
  ) => {
    setNotificationsAnchorEl(event.currentTarget);
    setNotificationsLoading(true);
    try {
      const response = await api.get('/customers/follow-ups/todays', {
        params: { page: 1, limit: 10 }
      });
      const data = Array.isArray(response.data?.data) ? response.data.data : [];
      setNotifications(
        data.map((item: any) => ({
          id: item.id,
          content: item.content,
          date: item.date,
          customer: item.customer
        }))
      );
      setNotificationsTotal(Number(response.data?.total) || data.length);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const handleCloseNotifications = () => {
    setNotificationsAnchorEl(null);
  };

  const refreshNotificationsCount = async () => {
    try {
      const response = await api.get('/customers/follow-ups/todays', {
        params: { page: 1, limit: 1 }
      });
      setNotificationsTotal(Number(response.data?.total) || 0);
    } catch {
      setNotificationsTotal(0);
    }
  };

  const updateFollowUpStatus = async (
    followUpId: string,
    status: 'completed' | 'cancelled'
  ) => {
    try {
      await api.patch(`/customers/follow-ups/${followUpId}`, { status });
      setNotifications(prev => prev.filter(n => n.id !== followUpId));
      setNotificationsTotal(prev => Math.max(prev - 1, 0));
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    if (user?.role === 'agent') {
      refreshNotificationsCount();
    }
  }, [user?.role]);

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'My Customers', icon: <PeopleIcon />, path: '/customers' },
    {
      text: 'Transaction Clients',
      icon: <AccountBalanceIcon />,
      path: '/customers/transaction-clients'
    },
    { text: 'Cold Leads', icon: <PhoneIcon />, path: '/cold-leads' },
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Reports', icon: <AssessmentIcon />, path: '/reports' }
  ];

  if (user?.role === 'admin') {
    menuItems.push({ text: 'Users', icon: <PeopleIcon />, path: '/users' });
  }

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          CRM
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user?.role ? `${user.role.toUpperCase()} DASHBOARD` : 'DASHBOARD'}
          </Typography>
          {user?.role === 'agent' && (
            <>
              <Tooltip title="Notifications">
                <IconButton
                  size="large"
                  aria-label="show notifications"
                  aria-controls="menu-notifications"
                  aria-haspopup="true"
                  onClick={handleOpenNotifications}
                  color="inherit"
                  sx={{ mr: 1 }}
                >
                  <Badge
                    badgeContent={notificationsTotal}
                    color="error"
                    overlap="circular"
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Menu
                id="menu-notifications"
                anchorEl={notificationsAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
                open={Boolean(notificationsAnchorEl)}
                onClose={handleCloseNotifications}
                PaperProps={{
                  sx: {
                    width: 360,
                    maxWidth: '90vw',
                    mt: 1
                  }
                }}
              >
                <MenuItem
                  disabled
                  sx={{
                    opacity: 1,
                    cursor: 'default',
                    '&.Mui-disabled': { opacity: 1 },
                    py: 1.2
                  }}
                >
                  <ListItemText
                    primary={`Today's Follow-ups (${notificationsTotal})`}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      fontWeight: 600
                    }}
                  />
                </MenuItem>
                <Divider />
                {notificationsLoading ? (
                  <MenuItem>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={18} />
                          Loading notifications...
                        </Box>
                      }
                    />
                  </MenuItem>
                ) : notifications.length === 0 ? (
                  <MenuItem>
                    <ListItemText primary="No notifications for today" />
                  </MenuItem>
                ) : (
                  notifications.map(n => (
                    <MenuItem
                      key={n.id}
                      dense
                      sx={{
                        alignItems: 'flex-start',
                        py: 1.25,
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ pr: 12, width: '100%' }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 600 }}
                        >
                          {n.customer?.username || 'Unknown'}{' '}
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                          >
                            ({n.customer?.externalId || '-'})
                          </Typography>
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 0.5,
                            whiteSpace: 'normal',
                            wordBreak: 'break-word'
                          }}
                        >
                          {n.content}
                        </Typography>
                        <Box
                          sx={{
                            mt: 0.75,
                            display: 'flex',
                            gap: 1,
                            alignItems: 'center'
                          }}
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            icon={<AccessTimeIcon sx={{ fontSize: 14 }} />}
                            label={formatFollowUpTime(n.date)}
                          />
                        </Box>
                      </Box>
                      <ListItemSecondaryAction>
                        <Tooltip title="Mark as done">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() =>
                              updateFollowUpStatus(n.id, 'completed')
                            }
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              updateFollowUpStatus(n.id, 'cancelled')
                            }
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </MenuItem>
                  ))
                )}
              </Menu>
            </>
          )}
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              PaperProps={{ sx: { mt: 1 } }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth
            }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
