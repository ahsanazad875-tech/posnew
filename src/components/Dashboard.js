import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Grid, Paper, Badge, Button, AppBar, 
  Toolbar, IconButton, useTheme, useMediaQuery 
} from '@mui/material';
import {
  Inventory, MonetizationOn, PersonAdd, Update,
  ShoppingCartCheckout, ListAlt, Login, Logout, Assessment,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth'; // ADD THIS IMPORT
import { db, auth } from '../firebase'; // ADD auth IMPORT
import { useAuth } from '../contexts/AuthContext'; // ADD THIS IMPORT
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Extract user data properly
  const role = currentUser?.role || 'user';
  const email = currentUser?.email || '';
  const branchId = currentUser?.branchId;
  const isAuthenticated = !!currentUser;

  const allMenuItems = {
    admin: [
      { label: 'Manage Branches', icon: <DashboardIcon />, action: () => navigate('/manage-branches'), color: 'linear-gradient(135deg, #3a1c71 0%, #d76d77 50%, #ffaf7b 100%)' },
      { label: 'Add Product', icon: <Inventory />, action: () => navigate('/add-product'), color: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
      { label: 'Stock Alert', icon: <MonetizationOn />, action: () => navigate('/stock-alert'), color: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
      { label: 'Add User', icon: <PersonAdd />, action: () => navigate('/add-user'), color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
      { label: 'List Items', icon: <ListAlt />, action: () => navigate('/list-items'), color: 'linear-gradient(135deg, #f46b45 0%, #eea849 100%)' },
      { label: 'Update Stock', icon: <Update />, action: () => navigate('/update-stock'), color: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)' },
      { label: 'Modify User', icon: <Update />, action: () => navigate('/modify-user'), color: 'linear-gradient(135deg, #c31432 0%, #240b36 100%)' },
      { label: 'Checkout', icon: <ShoppingCartCheckout />, action: () => navigate('/checkout'), color: 'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)' },
      { label: 'Sales Report', icon: <Assessment />, action: () => navigate('/sales-report'), color: 'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)' },
    ],
    user: [
      { label: 'List Items', icon: <ListAlt />, action: () => navigate('/list-items'), color: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
      { label: 'Checkout', icon: <ShoppingCartCheckout />, action: () => navigate('/checkout'), color: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)' },
      { label: 'Sales Report', icon: <Assessment />, action: () => navigate('/sales-report'), color: 'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)' },
    ],
  };

  const menuItems = allMenuItems[role] || [];

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = () => navigate('/login');

  useEffect(() => {
    const fetchStats = async () => {
      if (!isAuthenticated) return;
      
      try {
        let productQuery = collection(db, 'products');
        let userQuery = collection(db, 'users');
        let ordersQuery = collection(db, 'orders');

        // Filter by branch if not admin
        if (role !== 'admin' && branchId) {
          productQuery = query(productQuery, where('branchId', '==', branchId));
          userQuery = query(userQuery, where('branchId', '==', branchId));
          ordersQuery = query(ordersQuery, where('branchId', '==', branchId));
        }

        const [productSnapshot, userSnapshot, ordersSnapshot] = await Promise.all([
          getDocs(productQuery),
          getDocs(userQuery),
          getDocs(ordersQuery)
        ]);

        const lowStockItems = productSnapshot.docs.filter(doc => doc.data().stock < 2);
        setLowStockCount(lowStockItems.length);

        setStats([
          { label: 'Total Products', sub: `${productSnapshot.size} items`, color: 'linear-gradient(135deg, #2196f3, #1976d2)', icon: <Inventory sx={{ fontSize: 40, opacity: 0.8 }} /> },
          { label: 'Low Stock Items', sub: `${lowStockItems.length} items`, color: 'linear-gradient(135deg, #f44336, #d32f2f)', icon: <MonetizationOn sx={{ fontSize: 40, opacity: 0.8 }} /> },
          { label: 'Total Users', sub: `${userSnapshot.size} users`, color: 'linear-gradient(135deg, #4caf50, #388e3c)', icon: <PersonAdd sx={{ fontSize: 40, opacity: 0.8 }} /> },
          { label: 'Total Orders', sub: `${ordersSnapshot.size} orders`, color: 'linear-gradient(135deg, #ff9800, #f57c00)', icon: <ShoppingCartCheckout sx={{ fontSize: 40, opacity: 0.8 }} /> },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [role, branchId, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <Box sx={{ 
        p: 4, 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f5f7fa, #e4e8eb)'
      }}>
        <Typography variant="h4" sx={{ 
          mb: 3,
          fontWeight: 'bold',
          background: 'linear-gradient(to right, #3a7bd5, #00d2ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Welcome to POS System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Please login to access the dashboard
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Login />} 
          onClick={handleLogin}
          sx={{ 
            mt: 2,
            px: 4,
            py: 1.5,
            borderRadius: '50px',
            background: 'linear-gradient(to right, #3a7bd5, #00d2ff)',
            boxShadow: '0 4px 15px rgba(58, 123, 213, 0.4)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(58, 123, 213, 0.6)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          Login
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #f5f7fa, #e4e8eb)'
      }}
    >
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(to right, #3a7bd5, #00d2ff)',
          mb: 3,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: '700',
              textTransform: 'capitalize'
            }}>
              {role} Dashboard
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ 
              mr: 2,
              fontWeight: '500',
              display: { xs: 'none', sm: 'block' }
            }}>
              {email}
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={handleLogout}
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)'
                },
                transition: 'all 0.3s ease'
              }}
              title="Logout"
            >
              <Logout />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: isMobile ? 2 : 3, flex: 1 }}>
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: '12px',
          background: 'linear-gradient(to right, #ffffff, #f8f9fa)',
          boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: '700',
              mb: 1,
              color: '#2c3e50'
            }}>
              Welcome back, {currentUser?.name || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#7f8c8d',
              maxWidth: '600px'
            }}>
              {role === 'admin' 
                ? 'You have full access to manage products, users, and view sales reports.' 
                : 'You can browse products and process customer checkouts.'}
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{
          mb: 3,
          color: '#34495e',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          '&:before': {
            content: '""',
            display: 'block',
            width: '4px',
            height: '24px',
            backgroundColor: '#3498db',
            marginRight: '12px',
            borderRadius: '2px',
          },
        }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  height: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '16px',
                  background: item.color,
                  color: 'white',
                  transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
                  animation: `${fadeIn} 0.5s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
                  },
                }}
                onClick={item.action}
              >
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 60,
                    width: 60,
                    mb: 2,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    animation: item.label === 'Stock Alert' && lowStockCount > 0 ? `${pulse} 2s infinite` : 'none',
                  }}
                >
                  {item.label === 'Stock Alert' ? (
                    <Badge
                      color="error"
                      badgeContent={lowStockCount > 0 ? lowStockCount : null}
                      overlap="circular"
                      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: '600',
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '1px 1px 3px rgba(0,0,0,0.2)'
                }}>
                  {item.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {role === 'admin' && (
          <Box>
            <Typography variant="h6" sx={{
              mb: 3,
              color: '#34495e',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              '&:before': {
                content: '""',
                display: 'block',
                width: '4px',
                height: '24px',
                backgroundColor: '#3498db',
                marginRight: '12px',
                borderRadius: '2px',
              },
            }}>
              System Overview
            </Typography>
            <Grid container spacing={3}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper
                    elevation={4}
                    sx={{
                      p: 3,
                      background: stat.color,
                      color: '#fff',
                      borderRadius: '16px',
                      minHeight: '160px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                      },
                    }}
                  >
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 20, 
                      right: 20,
                      opacity: 0.2
                    }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h4" sx={{ 
                      fontWeight: '700', 
                      mb: 1,
                      textShadow: '1px 1px 3px rgba(0,0,0,0.2)'
                    }}>
                      {stat.sub}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ 
                      opacity: 0.9,
                      textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
                    }}>
                      {stat.label}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;