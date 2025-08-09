import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { keyframes } from '@emotion/react';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../contexts/AuthContext';

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

const ModifyUser = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userSnapshot = await getDocs(collection(db, 'users'));
      const userList = userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);
      console.log(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const fetchBranches = async () => {
    const snapshot = await getDocs(collection(db, 'branches'));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(list);
    setBranches(list);
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setError(null);
    setSuccess(null);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    // Basic validation
    if (!selectedUser.name || !selectedUser.email || !selectedUser.role) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', selectedUser.id);

      await updateDoc(userRef, {
        name: selectedUser.name.trim(),
        email: selectedUser.email.trim(),
        role: selectedUser.role,
        password: selectedUser.password, // Note: In production, use proper auth methods
        branchId: selectedUser.branchId || ''
      });
      
      setSuccess('User updated successfully!');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setSuccess('User deleted successfully!');
      setSelectedUser(null);
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user.');
    } finally {
      setLoading(false);
    }
  };

  // Columns for DataGrid
  const columns = [
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ 
            bgcolor: params.row.role === 'admin' ? '#3f51b5' : '#4caf50',
            mr: 2,
            width: 32, 
            height: 32
          }}>
            <PersonIcon fontSize="small" />
          </Avatar>
          <Typography fontWeight="500">{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EmailIcon color="action" sx={{ mr: 1 }} />
          <Typography>{params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      flex: 1,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'admin' ? 'primary' : 'success'}
          size="small"
          icon={params.value === 'admin' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
          sx={{ 
            fontWeight: '500',
            borderRadius: '6px'
          }}
        />
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
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => {
        return (
          <Button
            variant="outlined"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => handleUserClick(params.row)}
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
        <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 32, mr: 1 }} />
        <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
          User Management
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

      {/* DataGrid for displaying users */}
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
          rows={users}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center'  // Vertically center cell content
            }
          }}
        />
      </Paper>

      {/* Edit User Form */}
      {selectedUser && (
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
              Editing: {selectedUser.name}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Name"
                value={selectedUser.name || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                value={selectedUser.email || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Role"
                value={selectedUser.role || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AdminPanelSettingsIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                value={selectedUser.password || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ width: '200px' }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Branch</InputLabel>
                  <Select
                    fullWidth
                    sx={{ width: '100%' }} // ✅ explicitly set width
                    value={selectedUser.branchId || ''}
                    label="Branch"
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, branchId: e.target.value })
                    }
                  >
                    {branches.map((branch) => (
                      <MenuItem key={branch.id} value={branch.id}>
                        <Box sx={{ whiteSpace: 'normal' }}>{branch.name}</Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              onClick={() => setSelectedUser(null)}
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
              onClick={handleUpdateUser}
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
          Confirm User Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.name}"? This action cannot be undone.
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
            onClick={handleDeleteUser}
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

export default ModifyUser;