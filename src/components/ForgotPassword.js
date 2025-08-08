import React, { useState, useEffect } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../firebase';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert, 
  LinearProgress,
  InputAdornment
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SendIcon from '@mui/icons-material/Send';
import { keyframes } from '@emotion/react';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);  // Countdown for link expiration
  const auth = getAuth(app);

  const handleSend = async () => {
    setMessage('');
    setError('');
    setLoading(true);

    if (!email) {
      setError("Please enter a valid email.");
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`Password reset link has been sent to ${email}`);
      
      // Set the countdown to 5 minutes (300 seconds)
      setCountdown(300);

    } catch (err) {
      console.error("Error:", err);
      if (err.code === 'auth/user-not-found') {
        setError("Email is not valid or not registered.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => clearInterval(timer);  // Clear the interval on component unmount or when countdown ends
  }, [countdown]);

  // Format countdown time (mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      p: 2
    }}>
      <Paper 
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: '500px',
          p: 4,
          borderRadius: '16px',
          animation: `${fadeIn} 0.5s ease-out`,
          background: 'white',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 3,
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
          <Typography variant="h4" sx={{ fontWeight: '600', color: '#2c3e50' }}>
            Password Recovery
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 3, color: '#555' }}>
          Enter your registered email address to receive a password reset link.
        </Typography>

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

        {message && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: '8px',
              animation: `${fadeIn} 0.3s ease-out`
            }}
          >
            {message}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        <TextField
          fullWidth
          label="Registered Email Address"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon color="action" />
              </InputAdornment>
            ),
          }}
          type="email"
          required
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSend}
          disabled={loading}
          startIcon={<SendIcon />}
          sx={{
            py: 1.5,
            borderRadius: '8px',
            background: 'linear-gradient(90deg, #3f51b5, #2196f3)',
            color: 'white',
            fontWeight: '600',
            textTransform: 'none',
            fontSize: '1rem',
            boxShadow: '0 4px 6px rgba(63, 81, 181, 0.2)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 10px rgba(63, 81, 181, 0.3)',
              background: 'linear-gradient(90deg, #2196f3, #3f51b5)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
            animation: `${pulse} 2s infinite`
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        {countdown > 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: '#999' }}>
            Link will expire in: {formatTime(countdown)}
          </Typography>
        )}
        {countdown <= 0 && message && (
          <Typography variant="body2" sx={{ mt: 2, color: '#e74c3c' }}>
            The reset link has expired. Please request a new one.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
