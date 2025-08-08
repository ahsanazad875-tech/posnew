import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Chip, LinearProgress, Alert, Select, MenuItem } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getDocs, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { keyframes } from '@emotion/react';
import WarningIcon from '@mui/icons-material/Warning';
import InventoryIcon from '@mui/icons-material/Inventory';

// Animation keyframes
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StockAlert = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [branches, setBranches] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch low stock products
  const fetchLowStockProducts = async () => {
    try {
      setLoading(true);
      const productSnapshot = await getDocs(collection(db, 'products'));
      const lowStockItems = productSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          const stockLow = data.stock < 2;
          const branchMatch = selectedBranch === '' || data.branchId === selectedBranch;
          return stockLow && branchMatch;
        })
        .map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          stockLevel: (doc.data().stock / 2) * 100 // Calculate stock level percentage
        }));

      setLowStockProducts(lowStockItems);
      setError(null);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch low stock products every 10 seconds and in real-time
  useEffect(() => {
    // Real-time subscription for product changes
    const unsubscribe = onSnapshot(collection(db, 'products'), (productSnapshot) => {
      try {
        const lowStockItems = productSnapshot.docs
          .filter(doc => {
            const data = doc.data();
            const stockLow = data.stock < 2;
            const branchMatch = selectedBranch === '' || data.branchId === selectedBranch;
            return stockLow && branchMatch;
          })
          .map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            stockLevel: (doc.data().stock / 2) * 100
          }));

        setLowStockProducts(lowStockItems);
        setError(null);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
        setError('Error updating stock data in real-time.');
      }
    });

    // Initial fetch
    fetchLowStockProducts();

    const fetchBranches = async () => {
      const snapshot = await getDocs(collection(db, 'branches'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBranches(data);
    };
    fetchBranches();

    // Set an interval to fetch data every 10 seconds
    const intervalId = setInterval(fetchLowStockProducts, 10000);

    // Cleanup on component unmount
    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchLowStockProducts();
  }, [selectedBranch]);
  // Define columns for the DataGrid
  const columns = [
    { 
      field: 'productName', 
      headerName: 'Product Name', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon color="action" sx={{ mr: 1 }} />
          <Typography fontWeight="500">{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'stock', 
      headerName: 'Stock Level', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <LinearProgress 
            variant="determinate" 
            value={params.row.stockLevel} 
            sx={{ 
              height: 10,
              borderRadius: 5,
              backgroundColor: '#f5f5f5',
              '& .MuiLinearProgress-bar': {
                backgroundColor: params.value <= 0 ? '#f44336' : 
                                params.value < 1 ? '#ff9800' : '#4caf50'
              }
            }}
          />
          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: '500' }}>
            {params.value} {params.value === 1 ? 'unit' : 'units'} remaining
          </Typography>
        </Box>
      )
    },
    { 
      field: 'sellPrice', 
      headerName: 'Price', 
      flex: 1,
      renderCell: (params) => (
        <Typography fontWeight="500">
          ${params.value.toFixed(2)}
        </Typography>
      )
    },
  ];

  return (
    <Box sx={{ 
      p: 4,
      animation: `${fadeIn} 0.5s ease-out`
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 3,
        '&:before': {
          content: '""',
          display: 'block',
          width: '4px',
          height: '32px',
          backgroundColor: '#f44336',
          mr: 2,
          borderRadius: '2px'
        }
      }}>
        <WarningIcon color="error" sx={{ fontSize: 32, mr: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
          Stock Alerts
        </Typography>
        <Chip 
          label={`${lowStockProducts.length} items`} 
          color="error" 
          sx={{ 
            ml: 2,
            fontSize: '0.875rem',
            fontWeight: '600',
            animation: lowStockProducts.length > 0 ? `${pulse} 2s infinite` : 'none'
          }} 
        />
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            animation: `${fadeIn} 0.3s ease-out`
          }}
        >
          {error}
        </Alert>
      )}
      <Box sx={{ maxWidth: 300, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter by Branch</Typography>
        <Select
          fullWidth
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">All Branches</MenuItem>
          {branches.map(branch => (
            <MenuItem key={branch.id} value={branch.id}>
              {branch.name}
            </MenuItem>
          ))}
        </Select>
      </Box>
      {loading ? (
        <LinearProgress sx={{ my: 2 }} />
      ) : lowStockProducts.length > 0 ? (
        <Paper 
          elevation={4} 
          sx={{ 
            height: '70vh', 
            width: '100%',
            borderRadius: '12px',
            overflow: 'hidden',
            '& .MuiDataGrid-root': {
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f7fa',
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.04)',
              }
            }
          }}
        >
          <DataGrid
            rows={lowStockProducts}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            loading={loading}
            sx={{
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: '600',
                color: '#555'
              }
            }}
          />
        </Paper>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          backgroundColor: 'rgba(76, 175, 80, 0.05)',
          borderRadius: '12px',
          p: 4,
          textAlign: 'center'
        }}>
          <InventoryIcon sx={{ fontSize: 60, color: '#4caf50', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: '500' }}>
            No Stock Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            All products have sufficient stock levels.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StockAlert;