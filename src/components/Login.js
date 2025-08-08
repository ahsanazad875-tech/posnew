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
import { query, where, getDocs, collection } from 'firebase/firestore'; // Add query import
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../firebase'; // Your Firebase app instance
import { getFirestore, doc, getDoc } from 'firebase/firestore'; // Firebase Firestore
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

const Login = ({ setAuth }) => {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app); // Firestore instance

const handleLogin = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);
  setMessage(''); // Clear previous message

  try {
    if (role === 'admin') {
      // Admin login via Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setAuth({
        role: 'admin',
        isAuthenticated: true,
        uid: user.uid,
        email: user.email,
      });
      setMessage('Login Successful!');
      navigate('/');
    } else if (role === 'user') {
      // For user, search email in Firestore (email is a field now)
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email)); // Query by email field
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]; // Get the first matching document
        const userData = userDoc.data();

        // Check if password matches (ensure you store hashed passwords, not plaintext)
        if (userData.password === password) {
          setAuth({
            role: 'user',
            isAuthenticated: true,
            email: userData.email,
            branchId: userData.branchId // ✅ Add this line
          });
          setMessage('Login Successful!');
          navigate('/Dashboard');
        } else {
          setError('Incorrect password. Please try again.');
          setMessage('Login Failed!');
        }
      } else {
        setError('No user found with this email address.');
        setMessage('Login Failed!');
      }
    }
  } catch (err) {
    setLoading(false);
    // Handle other Firebase errors
    if (err.code === 'auth/wrong-password') {
      setError('Incorrect password. Please try again.');
      setMessage('Login Failed!');
    } else if (err.code === 'auth/user-not-found') {
      setError('No user found with this email address.');
      setMessage('Login Failed!');
    } else if (err.code === 'auth/invalid-email') {
      setError('Invalid email address format.');
      setMessage('Login Failed!');
    } else {
      setError(err.message || 'An error occurred. Please try again.');
    }
  }

  // Reset the form after 3 seconds
  setTimeout(() => {
    setLoading(false);
    setEmail('');
    setPassword('');
    setError('');
    setMessage('');
  }, 1000); // Reset after 1 seconds
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
                  <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                  </Typography>
                )}

                {message && (
                  <Typography color="primary" sx={{ mb: 2 }}>
                    {message}
                  </Typography>
                )}

                <div className="forgot">
                  <Link to="/ForgotPassword">Forgot password?</Link>
                </div>

                <Button
                  type="submit"
                  className="btn"
                  disabled={loading}
                  fullWidth
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
