import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  Dialog,
  Grid,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  InputAdornment
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getDocs, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { keyframes } from '@emotion/react';
import InventoryIcon from '@mui/icons-material/Inventory';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';

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

const UpdateStock = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch products from Firestore
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const productSnapshot = await getDocs(collection(db, 'products'));
      const productList = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().stock < 2 ? 'Low' : 'In Stock'
      })).filter(product => !selectedBranch || product.branchId === selectedBranch);;
      const branchSnapshot = await getDocs(collection(db, 'branches'));
      const branchList = branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
      setFilteredProducts(productList); // Initialize filtered products with all products
      setBranches(branchList);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(); // Initial load
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedBranch]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setSuccess(null);
    setError(null);
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;

    const { id, productName, costPrice, sellPrice, stock } = selectedProduct;

    // Validate fields
    if (
      !productName?.trim() ||
      isNaN(costPrice) ||
      isNaN(sellPrice) ||
      isNaN(stock)
    ) {
      setError('Please enter valid values for all fields.');
      return;
    }

    try {
      setLoading(true);
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        productName: productName.trim(),
        costPrice: Number(costPrice),
        sellPrice: Number(sellPrice),
        stock: parseInt(stock),
        branchId: selectedProduct.branchId || '',
      });

      setSuccess('Product updated successfully!');
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      const productRef = doc(db, 'products', selectedProduct.id);
      await deleteDoc(productRef);

      setSuccess('Product deleted successfully!');
      setSelectedProduct(null);
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Failed to delete product.');
    } finally {
      setLoading(false);
    }
  };

  // Define columns for the DataGrid
  const columns = [
    { 
      field: 'productName', 
      headerName: 'Product Name', 
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
      field: 'branchId',
      headerName: 'Branch',
      flex: 1,
      renderCell: (params) => {
        const branch = branches.find(b => b.id === params.value);
        return <Typography>{branch?.name || 'Unknown'}</Typography>;
      }
    },
    { 
      field: 'costPrice', 
      headerName: 'Cost Price (Rs.)', 
      type: 'number',
      renderCell: (params) => (
        <Typography fontWeight="500">
          Rs. {params.value.toFixed(2)}
        </Typography>
      )
    },
    { 
      field: 'sellPrice', 
      headerName: 'Sell Price (Rs.)', 
      type: 'number',
      renderCell: (params) => (
        <Typography fontWeight="500">
          Rs. {params.value.toFixed(2)}
        </Typography>
      )
    },
    { 
      field: 'stock', 
      headerName: 'Stock', 
      type: 'number',
      renderCell: (params) => (
        <Chip
          label={`${params.value} ${params.value === 1 ? 'unit' : 'units'}`}
          color={params.value < 2 ? 'warning' : 'success'}
          size="small"
          sx={{ 
            fontWeight: '500',
            borderRadius: '6px'
          }}
        />
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => {
        return (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleProductClick(params.row)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            Edit
          </Button>
        );
      },
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
        mb: 4,
        '&:before': {
          content: '""',
          display: 'block',
          width: '4px',
          height: '40px',
          backgroundColor: '#3f51b5',
          mr: 2,
          borderRadius: '2px'
        }
      }}>
        <InventoryIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
          Update Stock
        </Typography>
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

      {success && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: 3,
            borderRadius: '8px',
            animation: `${fadeIn} 0.3s ease-out`
          }}
        >
          {success}
        </Alert>
      )}
        <Box sx={{ maxWidth: 300, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Filter by Branch</Typography>
          <TextField
            select
            fullWidth
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            SelectProps={{ native: false }}
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </TextField>
        </Box>
      {/* Search Bar */}
      <Paper 
        elevation={2} 
        sx={{ 
          mb: 3,
          p: 2,
          borderRadius: '12px',
          backgroundColor: '#f8f9fa'
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products by name or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: 'white',
            }
          }}
        />
      </Paper>

      {/* Display Product List in DataGrid */}
      <Paper 
        elevation={4} 
        sx={{ 
          height: '60vh', 
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          mb: 4,
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
          rows={filteredProducts}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          components={{
            NoRowsOverlay: () => (
              <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
              }}>
                <InventoryIcon sx={{ fontSize: 60, color: '#e0e0e0', mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                  {searchTerm ? 'No matching products found' : 'No products available'}
                </Typography>
                {searchTerm && (
                  <Button 
                    variant="text" 
                    color="primary" 
                    onClick={() => setSearchTerm('')}
                    sx={{ mt: 1 }}
                  >
                    Clear search
                  </Button>
                )}
              </Box>
            )
          }}
        />
      </Paper>

      {/* Edit Selected Product */}
      {selectedProduct && (
        <Paper 
          elevation={4} 
          sx={{ 
            p: 4,
            borderRadius: '12px',
            backgroundColor: '#f8f9fa',
            animation: `${fadeIn} 0.3s ease-out`
          }}
        >
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            mb: 3
          }}>
            <EditIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: '600' }}>
              Editing: {selectedProduct.productName}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Product Name"
                value={selectedProduct.productName ?? ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, productName: e.target.value })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{width: '200px'}}>
              <TextField
                select
                fullWidth
                label="Branch"
                value={selectedProduct.branchId || ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, branchId: e.target.value })
                }
                SelectProps={{ native: false }}
              >
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Cost Price (Rs.)"
                type="number"
                value={selectedProduct.costPrice ?? ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, costPrice: parseFloat(e.target.value) || 0 })
                }
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1 }}>Rs.</Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Sell Price (Rs.)"
                type="number"
                value={selectedProduct.sellPrice ?? ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, sellPrice: parseFloat(e.target.value) || 0 })
                }
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ mr: 1 }}>Rs.</Typography>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Stock Quantity"
                type="number"
                value={selectedProduct.stock ?? ''}
                onChange={(e) =>
                  setSelectedProduct({ ...selectedProduct, stock: parseInt(e.target.value) || 0 })
                }
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>
          </Grid>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mt: 3,
            justifyContent: 'flex-end'
          }}>
            <Button 
              variant="outlined" 
              color="inherit" 
              startIcon={<CloseIcon />}
              onClick={() => setSelectedProduct(null)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none'
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="error" 
              startIcon={<DeleteIcon />}
              onClick={() => setDeleteDialogOpen(true)}
              sx={{
                borderRadius: '8px',
                textTransform: 'none'
              }}
            >
              Delete
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={handleUpdateProduct}
              disabled={loading}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                minWidth: '120px',
                '&:hover': {
                  animation: `${pulse} 0.5s ease`
                }
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            p: 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedProduct?.productName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteProduct}
            disabled={loading}
            sx={{ borderRadius: '8px' }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpdateStock;