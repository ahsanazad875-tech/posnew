import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Grid, Paper, Alert, InputAdornment,
  Avatar, LinearProgress, MenuItem
} from '@mui/material';
import { db, collection, getDocs, addDoc, serverTimestamp } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
`;

const AddUser = () => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [branchId, setBranchId] = useState('');
  const [branches, setBranches] = useState([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch branches from Firestore
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'branches'));
        const branchList = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id
        }));
        setBranches(branchList);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches');
      }
    };

    fetchBranches();
  }, []);

  const handleAddUser = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!name || !email || !password || !branchId) {
      setError("Name, Email, Password, and Branch are required!");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (phone && !phoneRegex.test(phone)) {
      setError("Please enter a valid 10–11 digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const usersRef = collection(db, 'users');
      await addDoc(usersRef, {
        name,
        lastName,
        email,
        phone,
        password, // Note: In production, use Firebase Auth
        role: 'user',
        branchId,
        createdAt: serverTimestamp()
      });

      setSuccess('User added successfully!');
      setName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setBranchId('');

      setTimeout(() => {
        navigate('/users'); // or any other redirect
      }, 1500);
    } catch (err) {
      console.error("Error adding user: ", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
      <Paper elevation={6} sx={{
        width: '100%',
        maxWidth: '800px',
        p: 4,
        borderRadius: '16px',
        animation: `${fadeIn} 0.5s ease-out`,
        background: 'white',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
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
          <PersonAddIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
            Add New User
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}
        {loading && <LinearProgress sx={{ mb: 3 }} />}

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="First Name" value={name} onChange={(e) => setName(e.target.value)}
              required InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>
              }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PersonIcon color="action" /></InputAdornment>
              }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              type="email" required
              InputProps={{
                startAdornment: <InputAdornment position="start"><EmailIcon color="action" /></InputAdornment>
              }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              type="password" required
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon color="action" /></InputAdornment>
              }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)}
              type="tel" inputProps={{ maxLength: 11 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><PhoneIcon color="action" /></InputAdornment>
              }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              label="Select Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            >
              {branches.length === 0 ? (
                <MenuItem value="">Loading branches...</MenuItem>
              ) : (
                branches.map(branch => (
                  <MenuItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleAddUser}
            disabled={loading}
            startIcon={<PersonAddIcon />}
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: '8px',
              background: 'linear-gradient(90deg, #3f51b5, #2196f3)',
              color: 'white',
              fontWeight: '600',
              textTransform: 'none',
              fontSize: '1rem',
              boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
              animation: `${pulse} 2s infinite`,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 10px rgba(63, 81, 181, 0.3)',
                background: 'linear-gradient(90deg, #2196f3, #3f51b5)',
              },
              '&:disabled': {
                background: '#e0e0e0',
              },
              '&:active': {
                transform: 'translateY(0)',
              }
            }}
          >
            {loading ? 'Adding User...' : 'Add User'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AddUser;
