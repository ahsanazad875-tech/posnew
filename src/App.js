import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { useAuth } from './contexts/AuthContext';
import 'react-toastify/dist/ReactToastify.css';

// Component imports
import Login from './components/Login';
import ManageBranches from './components/ManageBranches';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import AddUser from './components/AddUser';
import AddProduct from './components/AddProduct';
import StockAlert from './components/StockAlert';
import UpdateStock from './components/UpdateStock';
import ModifyUser from './components/ModifyUser';
import ListItems from './components/ListItems';
import Checkout from './components/CheckoutPage';
import SalesReport from './components/SalesReport';

// Rest of your code remains the same...
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

function App() {
  const { currentUser, loading } = useAuth();

  function PrivateRoute({ children, allowedRoles }) {

    if (loading) {
      return <div>Loading...</div>; // show spinner while checking auth
    }

    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" />;
    }

    return children;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastContainer /> {/* ✅ Toast Notifications */}
      <Router>
        <Routes>
          <Route
              path="/login"
              element={currentUser ? <Navigate to="/" /> : <Login />}
            />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/sales-report" element={<SalesReport />} />
          <Route
            path="/"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/list-items"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}>
                <ListItems />
              </PrivateRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <PrivateRoute allowedRoles={['admin', 'user']}>
                <Checkout />
              </PrivateRoute>
            }
          />

          <Route
            path="/add-user"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AddUser />
              </PrivateRoute>
            }
          />

          <Route
            path="/add-product"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AddProduct />
              </PrivateRoute>
            }
          />

          <Route
            path="/stock-alert"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <StockAlert />
              </PrivateRoute>
            }
          />

          <Route
            path="/update-stock"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UpdateStock />
              </PrivateRoute>
            }
          />

          <Route
            path="/modify-user"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <ModifyUser />
              </PrivateRoute>
            }
          />
          <Route
            path="/manage-branches"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <ManageBranches />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
