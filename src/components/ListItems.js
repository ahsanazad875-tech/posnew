import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { keyframes } from '@emotion/react';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LowPriorityIcon from '@mui/icons-material/LowPriority';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../contexts/AuthContext'; // ✅ Required for branch-based filtering

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const ListItems = () => {
  const { currentUser } = useAuth(); // ✅ Access user info
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let productQuery = collection(db, 'products');

      // ✅ Restrict by branch if user is not admin
      if (currentUser?.role !== 'admin') {
        productQuery = query(productQuery, where('branchId', '==', currentUser?.branchId));
      }

      const snapshot = await getDocs(productQuery);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        productName: doc.data().productName,
        stock: doc.data().stock,
        sellPrice: doc.data().sellPrice,
        createdAt: doc.data().createdAt?.toDate()?.toLocaleDateString() || 'N/A',
        status: doc.data().stock < 2 ? 'Low' : 'In Stock'
      }));

      setRows(products);
      setFilteredRows(products);
    } catch (error) {
      console.error("Error fetching products: ", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentUser]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredRows(rows);
    } else {
      const filtered = rows.filter(row =>
        row.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.createdAt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.sellPrice.toString().includes(searchTerm)
      );
      setFilteredRows(filtered);
    }
  }, [searchTerm, rows]);

  const columns = [
    {
      field: 'productName',
      headerName: 'Product',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{
            bgcolor: params.row.status === 'Low' ? '#ff9800' : '#4caf50',
            mr: 2,
            width: 32,
            height: 32
          }}>
            <InventoryIcon fontSize="small" />
          </Avatar>
          <Typography fontWeight="500">{params.value}</Typography>
        </Box>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Low' ? 'warning' : 'success'}
          size="small"
          sx={{
            fontWeight: '500',
            borderRadius: '6px'
          }}
        />
      )
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 120,
      renderCell: (params) => (
        <Typography
          fontWeight="500"
          color={params.value < 2 ? 'error' : 'inherit'}
        >
          {params.value} {params.value === 1 ? 'unit' : 'units'}
        </Typography>
      )
    },
    {
      field: 'sellPrice',
      headerName: 'Price',
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography fontWeight="500" color="success.main">
            Rs. {params.value.toFixed(2)}
          </Typography>
        </Box>
      )
    },
    {
      field: 'createdAt',
      headerName: 'Added On',
      width: 150
    },
  ];

  return (
    <Box sx={{
      p: 3,
      animation: `${fadeIn} 0.5s ease-out`
    }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <InventoryIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
            Product Inventory
          </Typography>
          <Chip
            label={`${filteredRows.length} products`}
            color="primary"
            variant="outlined"
            sx={{
              ml: 2,
              fontSize: '0.875rem',
              fontWeight: '600'
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: '8px',
                backgroundColor: '#f5f7fa',
                width: '250px'
              }
            }}
          />
          <Tooltip title="Refresh data">
            <IconButton
              onClick={fetchProducts}
              sx={{
                backgroundColor: '#f5f7fa',
                '&:hover': {
                  backgroundColor: '#e0e8f0',
                  animation: `${pulse} 0.5s ease`
                }
              }}
            >
              <RefreshIcon color="primary" />
            </IconButton>
          </Tooltip>
        </Box>
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
              backgroundColor: 'rgba(63, 81, 181, 0.04)',
            }
          }
        }}
      >
        <DataGrid
          rows={filteredRows}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          components={{
            Toolbar: GridToolbar,
            LoadingOverlay: LinearProgress,
          }}
          sx={{
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: '600',
              color: '#555'
            },
            '& .MuiDataGrid-toolbarContainer': {
              p: 2,
              borderBottom: '1px solid #f0f0f0'
            }
          }}
        />
      </Paper>

      <Box sx={{
        mt: 3,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <LowPriorityIcon color="action" sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
};

export default ListItems;
