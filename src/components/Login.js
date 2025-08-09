import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl,
  Paper,
  Avatar,
  CssBaseline,
  CircularProgress
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, updateProfile } from 'firebase/auth';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import './Login.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

const Login = () => {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  setMessage('');

  try {
    const auth = getAuth();

    if (role === 'admin') {
      // Admin login - must use Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Verify admin role in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role !== 'admin') {
          setError('Access denied. Admin privileges required.');
          await auth.signOut();
          return;
        }
        setMessage('Login Successful!');
        navigate('/');
      } else {
        setError('Admin data not found. Please contact administrator.');
        await auth.signOut();
        return;
      }

    } else if (role === 'user') {
      // User login - try Firebase Auth first, then Firestore
      try {
        // Try Firebase Auth first
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role === 'admin') {
            setError('Please select "Admin" from the dropdown to login as admin.');
            await auth.signOut();
            return;
          }
          setMessage('Login Successful!');
          navigate('/');
        } else {
          setError('User data not found. Please contact administrator.');
          await auth.signOut();
          return;
        }

      } catch (authError) {
        console.log('Firebase auth failed, trying Firestore-only user login');
        
        // Fallback: Check for Firestore-only user
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDocSnap = querySnapshot.docs[0];
          const userData = userDocSnap.data();

          // Verify password (WARNING: This is insecure with plaintext passwords)
          if (userData.password === password) {
            if (userData.role === 'admin') {
              setError('Admin users must use secure authentication. Please contact administrator.');
              return;
            }

            // Create a temporary anonymous session for Firestore-only users
            try {
              await signInAnonymously(auth);
              const currentUser = auth.currentUser;
              
              // Update the anonymous user with email for identification
              await updateProfile(currentUser, {
                displayName: `firestore_user_${userDocSnap.id}`
              });

              // Store user data in session/local storage as fallback
              sessionStorage.setItem('legacyUserData', JSON.stringify({
                uid: userDocSnap.id,
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                role: userData.role || 'user',
                branchId: userData.branchId || null,
                isLegacyUser: true
              }));

              setMessage('Login Successful! (Legacy user - please update your account)');
              navigate('/');
            } catch (anonError) {
              console.error('Anonymous auth failed:', anonError);
              setError('Login failed. Please contact administrator.');
            }
          } else {
            setError('Incorrect password. Please try again.');
          }
        } else {
          setError('No user found with this email address.');
        }
      }
    }

  } catch (err) {
    console.error('Login error:', err);
    
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      setError(`No ${role} account found with this email address. Please check your credentials.`);
    } else if (err.code === 'auth/wrong-password') {
      setError('Incorrect password. Please try again.');
    } else if (err.code === 'auth/invalid-email') {
      setError('Invalid email address format.');
    } else if (err.code === 'auth/too-many-requests') {
      setError('Too many failed attempts. Please try again later.');
    } else {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  } finally {
    setLoading(false);
  }

  // Clear messages after delay
  if (message || error) {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  }
};

  return (
    <div className="container">
      <div className="login-box">
        <div className="left-side"></div>

        <div className="right-side">
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Paper elevation={0} sx={{ background: 'transparent', boxShadow: 'none' }}>
              <Avatar sx={{ m: 'auto', bgcolor: 'secondary.main' }}>
                <LockOutlined />
              </Avatar>
              <Typography component="h1" variant="h5" sx={{ textAlign: 'center', my: 2 }}>
                Sign in 
              </Typography>

              <Box component="form" onSubmit={handleLogin}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="role-label">Login As</InputLabel>
                  <Select
                    labelId="role-label"
                    value={role}
                    label="Login As"
                    onChange={(e) => setRole(e.target.value)}
                    variant="outlined"
                    className="dropdown"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </FormControl>

                <div className="input-group">
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    variant="standard"
                  />
                  <span className="icon">👤</span>
                </div>

                <div className="input-group">
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="standard"
                  />
                </div>

                {error && (
                  <Typography color="error" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    {error}
                  </Typography>
                )}

                {message && (
                  <Typography color="success.main" sx={{ mb: 2, fontSize: '0.875rem' }}>
                    {message}
                  </Typography>
                )}

                <div className="forgot">
                  <Link to="/forgotpassword">Forgot password?</Link>
                </div>

                <Button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2, mb: 2 }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      <span className="icon">👤</span> Sign In
                    </>
                  )}
                </Button>
              </Box>
            </Paper>
          </ThemeProvider>
        </div>
      </div>
    </div>
  );
};
export default Login;