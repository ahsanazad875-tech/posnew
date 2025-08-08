import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { db, addDoc, collection, getDocs, query, where, doc } from '../firebase';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import context
import { keyframes } from '@emotion/react';

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

const AddProduct = () => {
  const { currentUser } = useAuth(); // ✅ Get current user with branchId
  const [productName, setProductName] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!productName || !costPrice || !sellPrice || !productStock) {
      setError('All fields are required.');
      return;
    }

    if (parseFloat(sellPrice) <= parseFloat(costPrice)) {
      setError('Sell price must be greater than cost price.');
      return;
    }

    if (!currentUser?.branchId) {
      setError('Branch not assigned to current user.');
      return;
    }

    try {
      const branchRef = doc(db, 'branches', currentUser.branchId);
      const productsRef = collection(branchRef, 'products');

      // Check for duplicate product name in the same branch
      const productQuery = query(
        productsRef,
        where('productName', '==', productName.trim().toLowerCase())
      );
      const existingProducts = await getDocs(productQuery);

      if (!existingProducts.empty) {
        setError('A product with this name already exists in your branch!');
        return;
      }

      const newProduct = {
        productName: productName.trim().toLowerCase(),
        costPrice: parseFloat(costPrice),
        sellPrice: parseFloat(sellPrice),
        stock: parseInt(productStock),
        createdAt: new Date()
      };

      await addDoc(productsRef, newProduct);

      setProductName('');
      setCostPrice('');
      setSellPrice('');
      setProductStock('');
      setSuccess('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      p: 3
    }}>
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: '600px',
          p: 4,
          borderRadius: '16px',
          animation: `${fadeIn} 0.5s ease-out`,
          background: 'white',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="h4" gutterBottom sx={{
          mb: 3,
          fontWeight: '600',
          color: '#2c3e50',
          textAlign: 'center',
          position: 'relative',
          '&:after': {
            content: '""',
            display: 'block',
            width: '60px',
            height: '4px',
            background: 'linear-gradient(90deg, #3498db, #9b59b6)',
            margin: '10px auto 0',
            borderRadius: '2px'
          }
        }}>
          Add New Product
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField label="Product Name" fullWidth value={productName}
            onChange={(e) => setProductName(e.target.value)} sx={{ mb: 3 }} />

          <TextField label="Cost Price (Rs.)" fullWidth type="number" value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)} sx={{ mb: 3 }} />

          <TextField label="Sell Price (Rs.)" fullWidth type="number" value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)} sx={{ mb: 3 }} />

          <TextField label="Stock Quantity" fullWidth type="number" value={productStock}
            onChange={(e) => setProductStock(e.target.value)} sx={{ mb: 4 }} />

          <Button type="submit" variant="contained" fullWidth size="large"
            sx={{
              py: 1.5,
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #3498db, #2980b9)',
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              animation: `${pulse} 2s infinite`
            }}>
            Add Product
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default AddProduct;
