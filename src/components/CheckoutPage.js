import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  doc, getDocs, addDoc, collection, increment, writeBatch, serverTimestamp,
    query,
    where
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import {
  Box, Grid, Paper, Typography, Button,
  Table, TableBody, TableCell, TableContainer, Chip, IconButton, Divider,
  TableHead, TableRow, TextField, Select, MenuItem, InputAdornment, Alert, Collapse
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

const CheckoutPage = ({ userId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    customerName: '',
    date: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    paymentMethod: 'Cash',
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const formatPrice = (price) => price && !isNaN(price) ? Number(price).toFixed(2) : '0.00';
  const fetchBranches = async () => {
        if (currentUser?.role !== 'admin') return;
        try {
          const branchSnapshot = await getDocs(collection(db, 'branches'));
          const branchList = branchSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBranches(branchList);
          setSelectedBranch(branchList[0]?.id || '');
        } catch (err) {
          console.error('Error fetching branches:', err);
        }
      };
  const fetchProducts = async () => {
    let branchIdToUse = currentUser?.branchId;

      if (currentUser?.role === 'admin') {
        if (!selectedBranch) {
          setProducts([]);
          setLoading(false);
          return;
        }
        branchIdToUse = selectedBranch;
      }

      if (!branchIdToUse) {
        setError("Branch ID not found.");
        setLoading(false);
        return;
      }

    try {
        setLoading(true);

        let productQuery = collection(db, 'products');
        
        if (currentUser?.role === 'admin' && selectedBranch) {
          productQuery = query(productQuery, where('branchId', '==', selectedBranch));
        } else if (currentUser?.role !== 'admin') {
          productQuery = query(productQuery, where('branchId', '==', currentUser?.branchId));
        }

        const productsSnapshot = await getDocs(productQuery);
        const productsData = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          productName: doc.data().productName || 'Unnamed Product',
          costPrice: typeof doc.data().costPrice === 'number' ? doc.data().costPrice : 0,
          sellPrice: typeof doc.data().sellPrice === 'number' ? doc.data().sellPrice : 0,
          stock: typeof doc.data().stock === 'number' ? doc.data().stock : 0,
          branchId: typeof doc.data().branchId || ''
        }));
        setProducts(productsData);
        setError(null);
      } catch (err) {
        console.error("Error fetching products: ", err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchBranches();
    fetchProducts();
  }, [currentUser]);

  useEffect(() => {
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
    setTotal(totalAmount);
  }, [cartItems]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    // Reset cart when branch changes
    fetchProducts();
    setCartItems([]);
  }, [selectedBranch]);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sellPrice.toString().includes(searchTerm)
  );

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.error('This product is out of stock.');
      return;
    }
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Cannot add more than available stock (${product.stock})`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.productName} added to cart`);
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
    toast.info('Item removed from cart');
  };

  const updateQuantity = (id, qty) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock) {
      toast.error(`Only ${product.stock} items available`);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  const updatePrice = (id, newPrice) => {
    if (newPrice < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, sellPrice: Number(newPrice) } : item)
    );
  };

  const handleCheckout = async () => {
    const branchId = currentUser.role == 'admin' ? selectedBranch : currentUser.branchId;
    if (!branchId) {
      toast.error("Branch ID not found for current user.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    const belowCostItems = cartItems.filter(item => item.sellPrice < item.costPrice);
    if (belowCostItems.length > 0) {
      toast.error(
        `Cannot checkout: ${belowCostItems.length} item(s) priced below cost. ` +
        `First item: ${belowCostItems[0].productName}`
      );
      return;
    }

    if (!orderDetails.customerName.trim()) {
      toast.error("Please enter customer name");
      return;
    }

    setCheckoutLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const batch = writeBatch(db);
      const orderTotal = total;
      let totalCost = 0;
      let totalProfit = 0;

      const orderItems = cartItems.map(item => {
        const itemCost = item.costPrice * item.quantity;
        const itemRevenue = item.sellPrice * item.quantity;
        totalCost += itemCost;
        totalProfit += (itemRevenue - itemCost);
        return {
          id: item.id,
          productName: item.productName,
          sellPrice: item.sellPrice,
          costPrice: item.costPrice,
          quantity: item.quantity,
          itemCost: itemCost,
          itemProfit: (itemRevenue - itemCost)
        };
      });

      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        userId: userId || 'guest',
        customerName: orderDetails.customerName,
        items: orderItems,
        total: orderTotal,
        totalCost,
        totalProfit,
        profitMargin: (totalProfit / orderTotal * 100) || 0,
        ...orderDetails,
        branchId: branchId,
        timestamp: serverTimestamp()
      });

      cartItems.forEach(item => {
        const productRef = doc(db, 'products', item.id);
        batch.update(productRef, {
          stock: increment(-item.quantity),
          salesCount: increment(item.quantity)
        });
      });

      await batch.commit();

      // Refresh products
      const productsSnapshot = await getDocs(
        query(collection(db, 'products'), where('branchId', '==', branchId))
      );
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        productName: doc.data().productName || 'Unnamed Product',
        sellPrice: typeof doc.data().sellPrice === 'number' ? doc.data().sellPrice : 0,
        costPrice: typeof doc.data().costPrice === 'number' ? doc.data().costPrice : 0,
        stock: typeof doc.data().stock === 'number' ? doc.data().stock : 0,
      }));
      setProducts(productsData);

      setCartItems([]);
      setSuccess('Checkout successfully!');
      setOrderDetails(prev => ({ ...prev, customerName: '' }));
    } catch (err) {
      console.error('Checkout processing error: ', err);
      setError('Checkout failed. Please try again.');
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <Typography variant="h5">Loading products...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 4,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold',
          color: '#2c3e50',
          textAlign: 'center',
          mb: 4,
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        Park Shop
      </Typography>

      {/* Success Alert - Will auto-dismiss after 1 second */}
      <Collapse in={!!success}>
        <Alert
          severity="success"
          sx={{ mb: 3 }}
        >
          {success}
        </Alert>
      </Collapse>

      {/* Error Alert */}
      <Collapse in={!!error}>
        <Alert
          severity="error"
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      </Collapse>

      <Grid container spacing={4} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        {/* Product List */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ 
            p: 3, 
            borderRadius: '16px',
            overflow: 'hidden',
            top: 20,
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            minWidth: 300       // optional, avoid shrinking too much
          }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Available Products
            </Typography>
            {currentUser?.role === 'admin' && (
                <Box sx={{ mb: 3, maxWidth: "100%" }}>
                  <Select
                    fullWidth
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                    displayEmpty
                    size="small"
                  >
                    <MenuItem value="">Select Branch</MenuItem>
                    {branches.map(branch => (
                      <MenuItem key={branch.id} value={branch.id}>
                        {branch.name || branch.id}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              )}
            {/* Search Input */}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            <TableContainer>
              <Table sx={{
                border: '1px solid #e0e0e0',
                '& .MuiTableCell-root': {
                  border: '1px solid #e0e0e0',
                  padding: '8px 16px'
                },
                '& .MuiTableHead-root': {
                  '& .MuiTableCell-root': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  }
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell align="right">Price (Rs.)</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <TableRow key={product.id} hover>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell align="right">{formatPrice(product.sellPrice)}</TableCell>
                        <TableCell align="right">{product.stock}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddShoppingCartIcon />}
                            onClick={() => addToCart(product)}
                            disabled={product.stock < 1}
                            sx={{
                              bgcolor: '#3498db',
                              '&:hover': { bgcolor: '#2980b9' },
                              borderRadius: '8px',
                            }}
                          >
                            Add
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        No products found matching your search
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Cart Section */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ 
            p: 3, 
            position: 'sticky',
            top: 20,
            boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            overflow: 'hidden'
          }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                color: '#2c3e50',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              🛒 Your Cart
              <Chip 
                label={cartItems.reduce((total, item) => total + item.quantity, 0)} 
                color="primary"
                size="small"
              />
            </Typography>
            
            <TextField
              fullWidth
              label="Customer Name"
              value={orderDetails.customerName}
              onChange={(e) => setOrderDetails({...orderDetails, customerName: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <Select
              fullWidth
              value={orderDetails.paymentMethod}
              onChange={(e) => setOrderDetails({...orderDetails, paymentMethod: e.target.value})}
              sx={{ mb: 3 }}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Mobile Pay">Mobile Pay</MenuItem>
            </Select>
            
            <TableContainer>
              <Table size="small" sx={{
                border: '1px solid #e0e0e0',
                '& .MuiTableCell-root': {
                  border: '1px solid #e0e0e0',
                  padding: '8px 16px'
                },
                '& .MuiTableHead-root': {
                  '& .MuiTableCell-root': {
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold'
                  }
                }
              }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="center">Qty</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cartItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                        Your cart is empty
                      </TableCell>
                    </TableRow>
                  ) : (
                    cartItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="text"
                            value={item.sellPrice}
                            onChange={(e) => updatePrice(item.id, e.target.value)}
                            size="small"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                            }}
                            sx={{ 
                              width: '100px',
                              '& .MuiOutlinedInput-root': {
                                borderColor: item.sellPrice < item.costPrice ? 'error.main' : undefined,
                              }
                            }}
                            error={item.sellPrice < item.costPrice}
                            helperText={item.sellPrice < item.costPrice ? 
                              `Below cost (Rs.${item.costPrice.toFixed(2)})` : ''}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              sx={{ p: 0.5 }}
                            >
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                            <IconButton 
                              size="small" 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              sx={{ p: 0.5 }}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="right">Rs.{(item.sellPrice * item.quantity).toFixed(2)}</TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            onClick={() => removeFromCart(item.id)}
                            color="error"
                            sx={{ p: 0.5 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                borderTop: '1px solid #eee',
                pt: 1,
                mt: 1
              }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">
                  Rs.{total.toFixed(2)}
                </Typography>
              </Box>
            </Box>
            
            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              onClick={handleCheckout}
              disabled={checkoutLoading || cartItems.length === 0}
              sx={{
                py: 1.5,
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 6px 8px rgba(0,0,0,0.15)'
                },
                '&.Mui-disabled': {
                  bgcolor: 'primary.light',
                  color: 'white'
                }
              }}
            >
              {checkoutLoading ? 'Processing...' : 'Checkout Now'}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default CheckoutPage;