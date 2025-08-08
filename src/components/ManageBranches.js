import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Paper, Alert, List, ListItem, ListItemText, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc
} from 'firebase/firestore';

const ManageBranches = () => {
  const [branchName, setBranchName] = useState('');
  const [location, setLocation] = useState('');
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchBranches = async () => {
    const snapshot = await getDocs(collection(db, 'branches'));
    const branchList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setBranches(branchList);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = async () => {
    setError('');
    setSuccess('');

    if (!branchName.trim()) {
      setError('Branch name is required');
      return;
    }

    try {
      await addDoc(collection(db, 'branches'), {
        name: branchName.trim(),
        location: location.trim()
      });

      setSuccess('Branch added successfully!');
      setBranchName('');
      setLocation('');
      fetchBranches();
    } catch (err) {
      console.error(err);
      setError('Failed to add branch');
    }
  };

  const handleDelete = async (branchId) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;

    try {
      await deleteDoc(doc(db, 'branches', branchId));
      fetchBranches();
    } catch (err) {
      console.error(err);
      setError('Failed to delete branch');
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Branch Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 4 }}>
        <TextField
          fullWidth
          label="Branch Name"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddBranch}
          fullWidth
        >
          Add Branch
        </Button>
      </Paper>

      <Typography variant="h6">Existing Branches</Typography>
      <List>
        {branches.map(branch => (
          <ListItem
            key={branch.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => handleDelete(branch.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText
              primary={branch.name}
              secondary={branch.location || 'No location'}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default ManageBranches;
